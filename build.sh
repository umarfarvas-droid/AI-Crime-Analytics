#!/bin/bash
# Build and run the Java Crime Analytics application

set -e

echo "=========================================="
echo "AI Crime Analytics - Java Build Script"
echo "=========================================="
echo ""

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    echo "Error: Maven is not installed. Please install Maven 3.8.1 or higher."
    exit 1
fi

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "Error: Java is not installed. Please install Java 17 or higher."
    exit 1
fi

# Display versions
echo "Maven version:"
mvn -v | head -1
echo ""
echo "Java version:"
java -version
echo ""

# Build options
BUILD_TYPE="${1:-dev}"
SKIP_TESTS="${2:-false}"

echo "Building with profile: $BUILD_TYPE"
if [ "$SKIP_TESTS" = "true" ]; then
    echo "Skipping tests..."
    MAVEN_OPTS="-Xmx1024m -Xms512m"
    mvn clean package -P$BUILD_TYPE -DskipTests -Dmaven.javadoc.skip=true
else
    echo "Running tests..."
    MAVEN_OPTS="-Xmx1024m -Xms512m"
    mvn clean package -P$BUILD_TYPE
fi

echo ""
echo "=========================================="
echo "Build completed successfully!"
echo "=========================================="
echo ""

# If build successful, show output
if [ -f "target/ai-crime-analytics-1.0.0.jar" ]; then
    echo "JAR file created at: target/ai-crime-analytics-1.0.0.jar"
    echo ""
    echo "To run locally:"
    echo "  java -jar target/ai-crime-analytics-1.0.0.jar"
    echo ""
    echo "To run with Docker Compose:"
    echo "  docker-compose up -d"
fi
