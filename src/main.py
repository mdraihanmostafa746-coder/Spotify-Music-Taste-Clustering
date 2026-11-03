import pandas as pd
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware


from fastapi import FastAPI
from fastapi import FastAPI, Query
from pydantic import BaseModel, Field
import joblib
import numpy as np
from pathlib import Path

app = FastAPI(
    title="Spotify Music Taste Clustering API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load trained ML pipeline
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "spotify_kmeans_pipeline.joblib"

pipeline = joblib.load(MODEL_PATH)

scaler = pipeline["scaler"]
kmeans_model = pipeline["kmeans_model"]
features = pipeline["features"]
vibe_mapping = pipeline["vibe_mapping"]



class TrackFeatures(BaseModel):
    danceability: float = Field(ge=0, le=1)
    energy: float = Field(ge=0, le=1)
    acousticness: float = Field(ge=0, le=1)
    tempo: float = Field(gt=0)



@app.get("/")
def home():
    return {"message": "Spotify ML API is running!"}


@app.get("/health")
def health_check():
    return {"status": "healthy", "model_loaded": True}


@app.post("/predict")
def predict_vibe(track: TrackFeatures):

    input_data = pd.DataFrame([{
    "danceability": track.danceability,
    "energy": track.energy,
    "acousticness": track.acousticness,
    "tempo": track.tempo
}], columns=features)

    scaled_data = scaler.transform(input_data)
    cluster = int(kmeans_model.predict(scaled_data)[0])

    return {
        "cluster": cluster,
        "vibe": vibe_mapping[cluster]
    }
    

# Load engineered playlist data
PLAYLIST_PATH = BASE_DIR / "engineered_playlists.csv"
playlist_df = pd.read_csv(PLAYLIST_PATH)

# Load original Spotify dataset for audio features
DATASET_PATH = BASE_DIR / "dataset" / "spotify-tracks-dataset-detailed.csv"

audio_df = pd.read_csv(DATASET_PATH)

# Keep only required audio feature columns
audio_df = audio_df[
    [
        "track_name",
        "artists",
        "danceability",
        "energy",
        "acousticness",
        "tempo"
    ]
].copy()

# Remove rows without track name or artist
audio_df = audio_df.dropna(
    subset=["track_name", "artists"]
)


@app.get("/playlists/{vibe}")
def get_playlist(vibe: str, limit: int = 10):

    available_vibes = playlist_df["Vibe_Cluster_Label"].unique()

    if vibe not in available_vibes:
        raise HTTPException(
            status_code=404,
            detail={
                "message": "Vibe not found",
                "available_vibes": available_vibes.tolist()
            }
        )

    if limit < 1 or limit > 100:
        raise HTTPException(
            status_code=400,
            detail="Limit must be between 1 and 100"
        )

    tracks = playlist_df[
    playlist_df["Vibe_Cluster_Label"] == vibe
].drop_duplicates(
    subset=["Track_Name", "Artist"]
).head(limit)

    return {
        "vibe": vibe,
        "total_tracks_returned": len(tracks),
        "tracks": tracks.to_dict(orient="records")
    }


@app.get("/analytics")
def get_analytics():

    # Count tracks in each music vibe
    vibe_counts = (
        playlist_df["Vibe_Cluster_Label"]
        .value_counts()
    )

    total_tracks = len(playlist_df)

    # Prepare analytics response
    analytics = []

    for vibe, count in vibe_counts.items():

        percentage = (count / total_tracks) * 100

        analytics.append({
            "vibe": vibe,
            "track_count": int(count),
            "percentage": round(percentage, 2)
        })

    return {
        "total_tracks": total_tracks,
        "total_vibes": len(analytics),
        "vibe_distribution": analytics
    }



@app.get("/tracks/search")
def search_tracks(
    q: str = Query(..., min_length=1),
    vibe: str | None = None,
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0)
):
    search_results = playlist_df[
        playlist_df["Track_Name"].str.contains(
            q, case=False, na=False, regex=False
        )
        |
        playlist_df["Artist"].str.contains(
            q, case=False, na=False, regex=False
        )
    ]

    if vibe:
        search_results = search_results[
            search_results["Vibe_Cluster_Label"] == vibe
        ]

    search_results = search_results.drop_duplicates(
        subset=["Track_Name", "Artist"]
    )

    return search_results[
        ["Track_Name", "Artist", "Vibe_Cluster_Label"]
    ].iloc[skip:skip + limit].to_dict(orient="records")
    

@app.get("/tracks/details")
def get_track_details(
    track_name: str = Query(..., min_length=1),
    artist: str = Query(..., min_length=1)
):
    # Find track in playlist data
    track = playlist_df[
        (playlist_df["Track_Name"].str.casefold() == track_name.casefold()) &
        (playlist_df["Artist"].str.casefold() == artist.casefold())
    ]
    if track.empty:
        raise HTTPException(
            status_code=404,
            detail="Track not found"
        )
    result = track.iloc[0]

    # Find audio features in original dataset
    audio_track = audio_df[
        (audio_df["track_name"].str.casefold() == track_name.casefold()) &
        (audio_df["artists"].str.casefold() == artist.casefold())
    ]
    if audio_track.empty:
        raise HTTPException(
            status_code=404,
            detail="Audio features not found"
        )
    audio = audio_track.iloc[0]

    return {
        "track_name": result["Track_Name"],
        "artist": result["Artist"],
        "vibe": result["Vibe_Cluster_Label"],
        "danceability": float(audio["danceability"]),
        "energy": float(audio["energy"]),
        "acousticness": float(audio["acousticness"]),
        "tempo": float(audio["tempo"])
    }