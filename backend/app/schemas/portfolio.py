from ._base import CamelModel


class ProfileInfo(CamelModel):
    label: str
    value: str


class ProfileWork(CamelModel):
    label: str
    url: str


class ProfileContacts(CamelModel):
    phone: str
    email: str
    website: str


class UserProfile(CamelModel):
    name: str
    info: list[ProfileInfo]
    about: list[str]
    skills: list[str]
    goals: list[str]
    works: list[ProfileWork]
    contacts: ProfileContacts


class UserProfileUpdate(CamelModel):
    """Partial update — every field is optional. Missing fields stay as-is.

    `skills` and `goals` arrays replace in full; we do not try to merge item
    by item because arbitrary insertions/removals don't have a natural key.
    """

    name: str | None = None
    info: list[ProfileInfo] | None = None
    about: list[str] | None = None
    skills: list[str] | None = None
    goals: list[str] | None = None
    works: list[ProfileWork] | None = None
    contacts: ProfileContacts | None = None
