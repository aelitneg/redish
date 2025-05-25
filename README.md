# redish

Save links to an RSS feed you can ignore from anywhere.

## API Documentation

### 🟡 `POST /feeds`

Creates a new feed.

#### Response

```json
{
  "id": "c67a9be1-5182-40e1-88dd-7919bfa81154"
}
```

### 🔵 `PUT /feeds/{id}`

Add an item to a feed.

#### Query Parameters

| Name | Type   | Required | Description       |
| ---- | ------ | -------- | ----------------- |
| url  | string | true     | Link for the item |

#### Response

`200 OK`

### 🟢 `GET /feeds/{id}`

Get an RSS feed as XML.

### Response

```xml
<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Redish</title>
    <description>Save links to an RSS feed you can ignore from anywhere.</description>
    <link>https://redish.app</link>
    <item>
      <title>https://example.com/blog-post</title>
      <link>https://example.com/blog-post</link>
    </item>
  </channel>
</rss>
```
