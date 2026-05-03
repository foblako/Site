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
