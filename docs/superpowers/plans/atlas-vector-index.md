# Atlas Vector Search Indexes

Run these in MongoDB Atlas UI → Search → Create Search Index → JSON Editor.

## products_vector_index (database: shofy, collection: products)

```json
{
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 768, "similarity": "cosine" },
    { "type": "filter", "path": "status" },
    { "type": "filter", "path": "productType" },
    { "type": "filter", "path": "price" }
  ]
}
```

## blogposts_vector_index (database: shofy, collection: blogposts)

```json
{
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 768, "similarity": "cosine" },
    { "type": "filter", "path": "status" }
  ]
}
```

Wait for both indexes to reach "READY" before running the embedding backfill.
