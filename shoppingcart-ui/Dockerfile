# fabric8/java-alpine-openjdk8-jre is abandoned and carries a Java 8 runtime; this
# module now targets Java 21.
FROM eclipse-temurin:21-jre-alpine

RUN addgroup -S doms && adduser -S doms -G doms
COPY ["target/shoppingcart-ui-0.0.1-SNAPSHOT-exec.jar", "/app.jar"]
USER doms

EXPOSE 8080

# The old image hard-wired -Xdebug -Xrunjdwp, which opened a debugger port on every
# container including production ones, in a syntax JDK 21 no longer accepts. Debugging is
# opt-in now: run with -e JAVA_OPTS="$DEBUG_OPTS" when you want it.
ENV JAVA_OPTS=""
ENV DEBUG_OPTS="-agentlib:jdwp=transport=dt_socket,server=y,address=*:8787,suspend=n"

# -Djava.security.egd=file:/dev/./urandom worked around a JDK 8 entropy stall that has not
# existed since JDK 9.
ENTRYPOINT [ "sh", "-c", "exec java $JAVA_OPTS -Dspring.profiles.active=docker -jar /app.jar" ]
