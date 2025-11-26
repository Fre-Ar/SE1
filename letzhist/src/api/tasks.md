1. Look at the `components/data_types.tsx` file. The API functions will interact with that.

## Functions neeeded
1. Get a page for viewing
`GET /api/pages/:slug`

Purpose:
Load a single page (article) for the view mode, including sections, metadata and discussions.


**Params**
* slug – string, URL-safe identifier (ex: old-town-square)


**Return**
- Response 200: a PageData object.
- Response 404: page not found.
- Response 500: server error.

1. Update a page’s content (submit draft)
`PATCH /api/pages/:slug`

Purpose:
Update an existing page’s title / subtitle / tags / leadImage / sections markdown.

Add auth (only contributors/moderators can edit).

**Params**
* slug
* payload (changes, potentially any field of a PageData object)

**Return**
- Response 200: 
- Response 400: invalid payload (missing required fields / wrong types)
- Response 403: user not allowed to edit (if you add auth)
- Response 404: page not found
- Response 500: server error


4. Post a new discussion comment
`POST /api/pages/:slug/discussion`

Purpose:
Add a new comment to the discussion thread of a page.

**Params**
* slug 
* comment

The backend should infers account name and id from the authenticated user.

Response 201

{
  "comment": {
    "id": "c3",
    "pageId": "123",
    "authorName": "ArmandoF",
    "createdAt": "2025-11-19T10:15:00.000Z",
    "body": "Should we add a section about the weekly farmers’ market?"
  }
}


Error responses

400 – body empty or too long

403 – user not allowed to comment (if you add roles / bans)

404 – page not found

500 – server error
