from fastapi import APIRouter

from ..auth import login
from ..models import LoginRequest, TokenResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login_endpoint(body: LoginRequest) -> TokenResponse:
    return login(body.password)
