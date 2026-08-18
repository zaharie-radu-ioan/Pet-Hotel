from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app import config
from app.limiter import limiter
from app.routers import auth, catalog, rezervari, profile, animale, activitati

app = FastAPI(title="Pet-Hotel API")

# rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS: cu cookies NU merge "*"; trebuie origin explicit + credentials
app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(catalog.router)
app.include_router(rezervari.router)
app.include_router(profile.router)
app.include_router(activitati.router)
app.include_router(animale.router)

@app.get("/")
def health():
    return {"status": "ok"}
