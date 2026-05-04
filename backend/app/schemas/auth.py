from datetime import datetime

from pydantic import EmailStr, Field

from ._base import CamelModel


class RegisterIn(CamelModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(min_length=1, max_length=128)


class LoginIn(CamelModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class RefreshIn(CamelModel):
    refresh_token: str = Field(min_length=1)


class TokenPair(CamelModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserOut(CamelModel):
    id: str
    email: EmailStr
    display_name: str
    role: str
    created_at: datetime
