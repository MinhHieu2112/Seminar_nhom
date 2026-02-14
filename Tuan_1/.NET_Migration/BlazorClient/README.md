# BlazorClient (Blazor WebAssembly)

Run locally:

```bash
cd Tuan_1/.NET_Migration/BlazorClient
dotnet run
```

This will start the dev server for the Blazor WebAssembly app. The app expects backend API endpoints `/items` to be reachable at the same origin (or configure CORS / proxy).

Pages:
- `/` — home
- `/items` — items list + create (calls `GET /items` and `POST /items`)
