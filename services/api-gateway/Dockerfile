# Stage 1: Build application using Maven
FROM maven:3.9.8-amazoncorretto-21 AS build

WORKDIR /app

# Cache Maven dependencies (chỉ re-download khi pom.xml thay đổi)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source và build JAR
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Create lightweight runtime image
FROM amazoncorretto:21.0.4

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

# JVM tuning cho container (tránh OOM trên EC2)
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
