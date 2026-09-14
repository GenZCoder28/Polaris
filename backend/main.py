from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import expeditions
from backend.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Antarctic Expedition Planning & Command Management System (NCPOR)",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(expeditions.router)

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "Antarctic Expedition Planning Management System",
        "organization": "NCPOR (National Centre for Polar and Ocean Research)"
    }
