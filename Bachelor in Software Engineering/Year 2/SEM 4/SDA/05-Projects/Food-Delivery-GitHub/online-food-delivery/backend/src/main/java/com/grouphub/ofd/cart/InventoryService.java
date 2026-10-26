package com.grouphub.ofd.cart;

import com.grouphub.ofd.common.exception.InsufficientStockException;
import com.grouphub.ofd.restaurant.MenuItem;
import com.grouphub.ofd.restaurant.MenuItemRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Availability + reservation over menu items (SDD §5.6.3b).
 * Availability is menu_item.is_available (no separate stock count in the SDD ERD).
 */
@Service
public class InventoryService {

    private final MenuItemRepository menuItemRepo;

    public InventoryService(MenuItemRepository menuItemRepo) {
        this.menuItemRepo = menuItemRepo;
    }

    /** DT-M2-1 C2 — is the item currently available? */
    public boolean checkAvailability(long menuItemId, int quantity) {
        return menuItemRepo.findById(menuItemId).map(MenuItem::isAvailable).orElse(false);
    }

    /** DT-M2-2 C3 — reserve every line; throws if any is out of stock. Returns a reservation id. */
    public String reserveInventory(List<CartItem> items) {
        for (CartItem item : items) {
            MenuItem mi = menuItemRepo.findById(item.getMenuItemId()).orElse(null);
            if (mi == null || !mi.isAvailable())
                throw new InsufficientStockException(mi != null ? mi.getName() : ("item " + item.getMenuItemId()));
        }
        return "RSV-" + System.currentTimeMillis();
    }
}
