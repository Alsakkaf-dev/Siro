package com.grouphub.ofd.cart;

import com.grouphub.ofd.common.dto.CartDTO;
import com.grouphub.ofd.common.dto.CartItemDTO;
import com.grouphub.ofd.common.exception.InsufficientStockException;
import com.grouphub.ofd.common.exception.InvalidQuantityException;
import com.grouphub.ofd.restaurant.MenuItem;
import com.grouphub.ofd.restaurant.MenuItemRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Cart operations (SDD §5.6.3 / DT-M2-1). Owns quantity validation (C1),
 * availability (C2), the new-vs-existing line decision (C3), and cart totals.
 */
@Service
public class CartService {

    private final CartRepository cartRepo;
    private final CartItemRepository itemRepo;
    private final MenuItemRepository menuItemRepo;
    private final InventoryService inventory;

    public CartService(CartRepository cartRepo, CartItemRepository itemRepo,
                       MenuItemRepository menuItemRepo, InventoryService inventory) {
        this.cartRepo = cartRepo;
        this.itemRepo = itemRepo;
        this.menuItemRepo = menuItemRepo;
        this.inventory = inventory;
    }

    public ShoppingCart getOrCreateActiveCart(long userId) {
        ShoppingCart cart = cartRepo.findByUserIdAndStatus(userId, "ACTIVE");
        return cart != null ? cart : cartRepo.save(ShoppingCart.active(userId));
    }

    /** DT-M2-1 — add an item to the active cart. */
    public CartDTO addItem(long userId, Long menuItemId, Integer quantity) {
        if (quantity == null || quantity < 1 || quantity > 20)
            throw new InvalidQuantityException();                              // R1 → A4
        if (!inventory.checkAvailability(menuItemId, quantity))
            throw new InsufficientStockException(nameOf(menuItemId));          // R2 → A3
        ShoppingCart cart = getOrCreateActiveCart(userId);
        CartItem existing = itemRepo.findByCartIdAndMenuItemId(cart.getCartId(), menuItemId);
        if (existing == null) {                                               // C3 = N → R3 → A1
            MenuItem mi = menuItemRepo.findById(menuItemId).orElseThrow();
            CartItem ci = new CartItem();
            ci.setCartId(cart.getCartId());
            ci.setMenuItemId(menuItemId);
            ci.setQuantity(quantity);
            ci.setUnitPrice(mi.getPrice());
            itemRepo.save(ci);
        } else {                                                             // C3 = Y → R4 → A2
            existing.setQuantity(existing.getQuantity() + quantity);
            itemRepo.save(existing);
        }
        updateCartTotal(cart);
        return toDTO(cart);
    }

    public CartDTO updateItem(long userId, long cartItemId, Integer quantity) {
        if (quantity == null || quantity < 1 || quantity > 20) throw new InvalidQuantityException();
        ShoppingCart cart = getOrCreateActiveCart(userId);
        CartItem item = itemRepo.findById(cartItemId)
                .filter(ci -> ci.getCartId().equals(cart.getCartId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cart item not found"));
        item.setQuantity(quantity);
        itemRepo.save(item);
        updateCartTotal(cart);
        return toDTO(cart);
    }

    public CartDTO getCartDTO(long userId) { return toDTO(getOrCreateActiveCart(userId)); }

    public boolean validateCart(long cartId) { return !itemRepo.findByCartId(cartId).isEmpty(); } // DT-M2-2 C1

    public List<CartItem> getItems(long cartId) { return itemRepo.findByCartId(cartId); }

    public void convertCart(long cartId) {
        cartRepo.findById(cartId).ifPresent(c -> { c.setStatus("CONVERTED"); cartRepo.save(c); });
    }

    public void updateCartTotal(ShoppingCart cart) {
        BigDecimal subtotal = itemRepo.findByCartId(cart.getCartId()).stream()
                .map(CartItem::lineTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        cart.setSubtotal(subtotal);
        cart.setUpdatedAt(LocalDateTime.now());
        cartRepo.save(cart);
    }

    private CartDTO toDTO(ShoppingCart cart) {
        List<CartItemDTO> items = itemRepo.findByCartId(cart.getCartId()).stream()
                .map(ci -> new CartItemDTO(ci.getCartItemId(), ci.getMenuItemId(), nameOf(ci.getMenuItemId()),
                        ci.getQuantity(), ci.getUnitPrice(), ci.lineTotal()))
                .toList();
        return new CartDTO(cart.getCartId(), cart.getStatus(), items, cart.getSubtotal());
    }

    private String nameOf(Long menuItemId) {
        return menuItemRepo.findById(menuItemId).map(MenuItem::getName).orElse(null);
    }
}
