package com.jomeerkatz.gym.repositories;

import com.jomeerkatz.gym.domain.entities.Gym;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RestaurantRepository extends ElasticsearchRepository<Gym, String> {
    // todo: custom queries for later
}
