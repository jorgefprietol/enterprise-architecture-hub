FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY Architecture.Api/Architecture.Api.csproj Architecture.Api/
RUN dotnet restore Architecture.Api/Architecture.Api.csproj
COPY Architecture.Api/ Architecture.Api/
RUN dotnet publish Architecture.Api/Architecture.Api.csproj -c Release --no-restore -o /out
FROM mcr.microsoft.com/dotnet/aspnet:10.0
USER root
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/* && mkdir /data && chown app:app /data
WORKDIR /app
COPY --from=build /out .
USER app
EXPOSE 8080
ENTRYPOINT ["dotnet", "Architecture.Api.dll"]
