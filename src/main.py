import pandas as pd
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware


from fastapi import FastAPI
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

