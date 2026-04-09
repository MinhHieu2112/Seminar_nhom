FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ../../Tuan_1/.NET_Migration/BlazorClient/BlazorClient.csproj ./
COPY ../../Tuan_1/.NET_Migration/BlazorClient ./
RUN dotnet publish -c Release -o /app/publish

FROM nginx:alpine
COPY --from=build /app/publish/wwwroot /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
