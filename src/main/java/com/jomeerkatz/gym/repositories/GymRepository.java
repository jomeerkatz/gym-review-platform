package com.jomeerkatz.gym.repositories;

import com.jomeerkatz.gym.domain.entities.Gym;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.annotations.Query;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GymRepository extends ElasticsearchRepository<Gym, String> {
    Page<Gym> findByAverageRatingGreaterThanEqual(Float minRating, Pageable pageable);

    @Query("{\n" +
            "  \"bool\": {\n" + // boolean expression coming...
            "    \"must\": [\n" + // MUST condition, which has to be met
            "      {\n" +
            "        \"range\": {\n" + // we define a range which has to be met
            "          \"averageRating\": {\n" + // average Rating field in index "table"
            "            \"gte\": ?1\n" + // expression which has to be met: gte = greater then
            "          }\n" +
            "        }\n" +
            "      }\n" +
            "    ],\n" +
            "    \"should\": [\n" + // SHOULD condition, which have can be met (more flexible)
            "      {\n" +
            "        \"fuzzy\": {\n" + // describes how to do the search - fuzzy means it doesnt has to be 1:1
            "          \"name\": {\n" + // we want to look after gym names and...
            "            \"value\": \"?0\",\n" + // compare it with this value in param index 0
            "            \"fuzziness\": \"AUTO\"\n" + // ES self decides how to handle not 1:1 results
            "          }\n" +
            "        }\n" +
            "      },\n" +
            "      {\n" +
            "        \"fuzzy\": {\n" +
            "          \"gymType\": {\n" +
            "            \"value\": \"?0\",\n" +
            "            \"fuzziness\": \"AUTO\"\n" +
            "          }\n" +
            "        }\n" +
            "      }\n" +
            "    ],\n" +
            "    \"minimum_should_match\": 1\n" +
            "  }\n" +
            "}\n")
    Page<Gym> findByQueryAndMinRating(String query, Float minRating, Pageable pageable);

    @Query("{\n" +
            "  \"bool\": {\n" +
            "    \"must\": [\n" +
            "      {\n" +
            "        \"geo_distance\": {\n" +
            "          \"distance\": \"?2\",\n" +
            "          \"geoLocation\": {\n" +
            "            \"lat\": ?0,\n" +
            "            \"lon\": ?1\n" +
            "          }\n" +
            "        }\n" +
            "      }\n" +
            "    ]\n" +
            "  }\n" +
            "}\n")
    Page<Gym> findByLocationNear(
            Float latitude,
            Float longitude,
            Float radiusKm,
            Pageable pageable
    );
}
