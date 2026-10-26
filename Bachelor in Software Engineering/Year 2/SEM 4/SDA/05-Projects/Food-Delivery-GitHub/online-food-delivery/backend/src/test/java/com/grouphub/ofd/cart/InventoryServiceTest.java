package com.grouphub.ofd.cart;

import com.grouphub.ofd.common.exception.InsufficientStockException;
import com.grouphub.ofd.restaurant.MenuItem;
import com.grouphub.ofd.restaurant.MenuItemRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

/**
 * Verifies DT-M2-2 C3/R3 — reserveInventory rejects out-of-stock lines
 * (the TOCTOU safeguard the happy-path add flow cannot reach).
 */
@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    MenuItemRepository menuItemRepo;

    @InjectMocks
    InventoryService inventory;

    private CartItem line(long menuItemId, int qty) {
        CartItem ci = new CartItem();
        ci.setMenuItemId(menuItemId);
        ci.setQuantity(qty);
        return ci;
    }

    @Test
    void reserve_throws_when_item_unavailable() {
        MenuItem mi = new MenuItem();
        mi.setName("Tuna Roll");
        mi.setAvailable(false);
        when(menuItemRepo.findById(5L)).thenReturn(Optional.of(mi));

        assertThrows(InsufficientStockException.class,
                () -> inventory.reserveInventory(List.of(line(5L, 1))));
    }

    @Test
    void reserve_returns_id_when_all_available() {
        MenuItem mi = new MenuItem();
        mi.setName("Nasi Lemak Ayam");
        mi.setAvailable(true);
        when(menuItemRepo.findById(1L)).thenReturn(Optional.of(mi));

        String reservationId = inventory.reserveInventory(List.of(line(1L, 2)));
        assertTrue(reservationId.startsWith("RSV-"));
    }
}
