package com.doms.catalogservice.web.controllers;

import com.doms.catalogservice.entities.Product;
import com.doms.catalogservice.services.ProductService;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnitRunner;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Collections;
import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@RunWith(MockitoJUnitRunner.class)
public class ProductControllerTest {

    @Mock
    private ProductService productService;

    private MockMvc mockMvc;

    @Before
    public void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new ProductController(productService)).build();
    }

    @Test
    public void allProducts_returnsCatalogFromService() throws Exception {
        Product product = new Product();
        product.setId(1L);
        product.setCode("P001");
        product.setName("Aurora Wireless Headphones");
        when(productService.findAllProducts()).thenReturn(Collections.singletonList(product));

        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].code").value("P001"))
                .andExpect(jsonPath("$[0].name").value("Aurora Wireless Headphones"));
    }

    @Test
    public void productByCode_returns404WhenUnknown() throws Exception {
        when(productService.findProductByCode("UNKNOWN")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/products/UNKNOWN"))
                .andExpect(status().isNotFound());
    }

    @Test
    public void productByCode_returnsProductWhenFound() throws Exception {
        Product product = new Product();
        product.setId(2L);
        product.setCode("P002");
        product.setName("Nimbus Mechanical Keyboard");
        when(productService.findProductByCode("P002")).thenReturn(Optional.of(product));

        mockMvc.perform(get("/api/products/P002"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.name").value("Nimbus Mechanical Keyboard"));
    }
}
