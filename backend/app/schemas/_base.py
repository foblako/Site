from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Base schema that serializes Python `snake_case` fields as JSON `camelCase`.

    The frontend's TypeScript types in `src/types/index.ts` use `camelCase`
    (e.g. `statusIcon`, `fullDescription`, `communityRating`), so all response
    schemas inherit this so the JSON shape matches without manual aliasing.
    """

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )
