package com.jomeerkatz.gym.domain.entities;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class User {

    // Stored in Elasticsearch as a Keyword field.
    // Keyword fields are NOT analyzed, meaning the value is indexed exactly as-is.
    // Useful for IDs or fields where only exact matching should occur.
    @Field(type = FieldType.Keyword)
    private String id;

    // Stored in Elasticsearch as a Text field.
    // Text fields ARE analyzed, meaning the value is tokenized for full‑text search.
    // Useful for usernames or any fields where partial or flexible matching is desired.
    // The same logic applies to givenName and familyName.
    @Field(type = FieldType.Text)
    private String username;

    @Field(type = FieldType.Text)
    private String givenName;

    @Field(type = FieldType.Text)
    private String familyName;

}
