FROM maven:3.9.4-eclipse-temurin-17 AS build
WORKDIR /src
COPY ../../Tuan_1/Java_Migration/pom.xml ./
COPY ../../Tuan_1/Java_Migration ./
RUN mvn -B -f pom.xml -DskipTests package

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /src/target/*.jar ./app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
