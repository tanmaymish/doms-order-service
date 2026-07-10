package com.doms.inventoryservice.web.controllers;

import com.doms.inventoryservice.entities.InventoryItem;
import com.doms.inventoryservice.repositories.InventoryItemRepository;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnitRunner;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Arrays;
import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@RunWith(MockitoJUnitRunner.class)
public class InventoryControllerTest {

    @Mock
    private InventoryItemRepository inventoryItemRepository;

    private MockMvc mockMvc;

    @Before
    public void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new InventoryController(inventoryItemRepository)).build();
    }

    private InventoryItem item(String code, int qty) {
        InventoryItem item = new InventoryItem();
        item.setProductCode(code);
        item.setAvailableQuantity(qty);
        return item;
    }

    @Test
    public void findInventoryByProductCode_returnsItemWhenPresent() throws Exception {
        when(inventoryItemRepository.findByProductCode("P001")).thenReturn(Optional.of(item("P001", 250)));

        mockMvc.perform(get("/api/inventory/P001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.productCode").value("P001"))
                .andExpect(jsonPath("$.availableQuantity").value(250));
    }

    @Test
    public void findInventoryByProductCode_returns404WhenMissing() throws Exception {
        when(inventoryItemRepository.findByProductCode("MISSING")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/inventory/MISSING"))
                .andExpect(status().isNotFound());
    }

    @Test
    public void getInventory_returnsAllItems() throws Exception {
        when(inventoryItemRepository.findAll()).thenReturn(Arrays.asList(item("P001", 250), item("P002", 132)));

        mockMvc.perform(get("/api/inventory"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[1].productCode").value("P002"));
    }
}
