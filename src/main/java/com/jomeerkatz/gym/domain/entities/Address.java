package com.jomeerkatz.gym.domain.entities;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import javax.lang.model.element.TypeElement;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Address {
    // House or building number. Stored as Keyword because it is an exact value
    // and should not be analyzed or tokenized.
    @Field( type = FieldType.Keyword)
    private String streetNumber;

    // Name of the street (e.g., 'Main Street'). Stored as Text because it benefits
    // from full-text search and tokenization, allowing partial and flexible matches.
    @Field( type = FieldType.Text)
    private String streetName;

    // Apartment, suite, or unit identifier. Stored as Keyword because it should be
    // matched exactly and is not suitable for full-text search.
    @Field( type = FieldType.Keyword)
    private String unit;

    // City name. Stored as Keyword because city names are typically searched and
    // filtered by exact match rather than full-text search.
    @Field( type = FieldType.Keyword)
    private String city;

    // State or region code/name. Stored as Keyword because it is a fixed, exact value.
    @Field( type = FieldType.Keyword)
    private String state;

    // Postal or ZIP code. Stored as Keyword because it must match exactly and should
    // not be processed as full text.
    @Field( type = FieldType.Keyword)
    private String postalCode;

    // Country code or name. Stored as Keyword because it is an exact categorical value.
    @Field( type = FieldType.Keyword)
    private String country;
}
