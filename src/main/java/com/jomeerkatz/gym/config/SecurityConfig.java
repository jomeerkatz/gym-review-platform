package com.jomeerkatz.gym.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    // securityfilterchain gets into the spring context (gets a bean), where all request will go through
    // each filter we will create with the builder HttpSecurity (http), which has different "filter fields" which we can
    // configure.
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        // HttpSecurity (http) is the builder object
        // where we can create the filter -> the result with .build is from type SecurityFilterChain
        http
                // Enable CORS so Spring uses our corsConfigurationSource() bean
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth ->
                        // the authorization configurer -> auth is a builder object too where we
                        // also can define something. I define which HTTP requests are allowed / denied and under what
                        // conditions
                        auth
                                .requestMatchers(HttpMethod.GET, "/api/gyms/**").permitAll()
                                // allow this path, without authentification, since we want to show images, even when
                                // the user has no account
                                .requestMatchers(HttpMethod.GET, "/api/photos/**").permitAll()
                                // allow preflight OPTIONS requests without authentication (needed for CORS)
                                // means, browser can ask, can i really send this request. that's the meaning of OPTIONS
                                // is like GET, DELETE etc. (method)
                                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                                // every other request must be authenticated
                                .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth2 ->
                        // oauth2 is another builder/configurer object but this time
                        // specifically for resource server -> our backend is a resource server
                        // by writing this, we activate this application acts as a resource server where we use OAuth2
                        // security protocol
                        // this protocol wants to work with JWT/tokens which are coming from Keycloak!
                        // spring is now looking for Authorization: Bearer <token> on every request.
                        oauth2.jwt(jwt ->
                                // now we are going to the JWT configuration block (which is also a builder object)
                                // and this also says, we expect now JWT format tokens
                                // we access the settings for jwt
                                jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()) // use this custom converter
                                // when creating authentification objects
                        ))
                .sessionManagement(session ->
                        // spring security by default is designed for websites - not necessarily for rest api's
                        // that is why we want to "correct it"
                        // again we access a builder configurer
                        // session manager is like: should I store information about this user in memory (a session),
                        // so I don’t need to verify them again on the next request?
                        // so we decide over here, should we remember server side sessions
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                // CSRF = cross site request forgery -> A hacker tricks a user’s browser into sending an unwanted request
                // using the user’s cookies.
                // For REST APIs using JWT → CSRF protection is unnecessary and should be disabled.
                .csrf(csrf -> csrf.disable()) // not do for this build but think about it when in production
                .cors(cors -> cors.configurationSource(corsConfigurationSource()));
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // allow your Next.js frontend in dev
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000"));
        // allow common HTTP methods including OPTIONS (for preflight)
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        // allow all headers, including Authorization
        configuration.setAllowedHeaders(Arrays.asList("*"));
        // allow credentials (Authorization header / cookies) to be sent
        configuration.setAllowCredentials(true);
        // cache preflight responses for 1 hour
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        return new JwtAuthenticationConverter();
    }
}
