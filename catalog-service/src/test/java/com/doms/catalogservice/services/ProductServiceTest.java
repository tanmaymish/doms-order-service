package com.doms.catalogservice.services;

import com.doms.catalogservice.entities.Product;
import com.doms.catalogservice.repositories.ProductRepository;
import com.doms.catalogservice.web.models.ProductInventoryResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private InventoryServiceClient inventoryServiceClient;

    private ProductService productService;

    @BeforeEach
    public void setUp() {
        productService = new ProductService(productRepository, inventoryServiceClient);
    }

    private Product product(long id, String code) {
        Product p = new Product();
        p.setId(id);
        p.setCode(code);
        p.setName("Product " + code);
        p.setPrice(10.0);
        return p;
    }

    private ProductInventoryResponse inventory(String code, int qty) {
        ProductInventoryResponse r = new ProductInventoryResponse();
        r.setProductCode(code);
        r.setAvailableQuantity(qty);
        return r;
    }

    @Test
    public void findAllProducts_onlyReturnsProductsWithPositiveStock() {
        List<Product> products = Arrays.asList(product(1, "P001"), product(2, "P002"), product(3, "P003"));
        when(productRepository.findAll()).thenReturn(products);
        when(inventoryServiceClient.getProductInventoryLevels()).thenReturn(Arrays.asList(
                inventory("P001", 5),
                inventory("P002", 0)
                // P003 intentionally missing from inventory response
        ));

        List<Product> available = productService.findAllProducts();

        assertThat(available).extracting(Product::getCode).containsExactly("P001");
    }

    @Test
    public void findAllProducts_withEmptyInventory_returnsNoProducts() {
        when(productRepository.findAll()).thenReturn(Collections.singletonList(product(1, "P001")));
        when(inventoryServiceClient.getProductInventoryLevels()).thenReturn(Collections.emptyList());

        assertThat(productService.findAllProducts()).isEmpty();
    }

    @Test
    public void findProductByCode_marksInStockFalseWhenInventoryDepleted() {
        Product product = product(1, "P001");
        when(productRepository.findByCode("P001")).thenReturn(Optional.of(product));
        when(inventoryServiceClient.getProductInventoryByCode("P001")).thenReturn(Optional.of(inventory("P001", 0)));

        Optional<Product> result = productService.findProductByCode("P001");

        assertThat(result).isPresent();
        assertThat(result.get().isInStock()).isFalse();
    }

    @Test
    public void findProductByCode_marksInStockTrueWhenInventoryAvailable() {
        Product product = product(1, "P001");
        when(productRepository.findByCode("P001")).thenReturn(Optional.of(product));
        when(inventoryServiceClient.getProductInventoryByCode("P001")).thenReturn(Optional.of(inventory("P001", 12)));

        Optional<Product> result = productService.findProductByCode("P001");

        assertThat(result.get().isInStock()).isTrue();
    }

    @Test
    public void findProductByCode_returnsEmptyWhenProductUnknown() {
        when(productRepository.findByCode("MISSING")).thenReturn(Optional.empty());

        assertThat(productService.findProductByCode("MISSING")).isEmpty();
    }
}
