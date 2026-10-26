package com.grouphub.ofd.restaurant;

import com.grouphub.ofd.common.dto.MenuItemDTO;
import com.grouphub.ofd.common.dto.RestaurantDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * ── Structural: PROXY ── the caching surrogate over restaurant search
 * (SDD §5.6.2c · DT-M1-3), together with its «Subject» interface and the real
 * subject it wraps. RestaurantCacheProxy is @Primary, so callers of
 * IRestaurantService receive the proxy.
 */
interface IRestaurantService {   // UML: «Subject» (shared interface)

    List<RestaurantDTO> searchRestaurants(String loc, String cuisine, double rating);

    List<MenuItemDTO> getMenuItems(long restaurantId);
}

/**
 * Real subject — reads the DB on every call. Closed restaurants are returned
 * with isOpen=false (not filtered) so the UI can show "Currently Closed" (R4/A4).
 */
@Service
class RestaurantService implements IRestaurantService {

    private static final Logger log = LoggerFactory.getLogger(RestaurantService.class);

    private final RestaurantRepository restaurantRepo;
    private final MenuItemRepository menuItemRepo;

    RestaurantService(RestaurantRepository restaurantRepo, MenuItemRepository menuItemRepo) {
        this.restaurantRepo = restaurantRepo;
        this.menuItemRepo = menuItemRepo;
    }

    @Override
    public List<RestaurantDTO> searchRestaurants(String loc, String cuisine, double rating) {
        log.debug("CACHE MISS — querying DB for loc={}, cuisine={}, rating>={}", loc, cuisine, rating);
        return restaurantRepo.findAll().stream()
                .filter(r -> blank(loc) || contains(r.getLocation(), loc))
                .filter(r -> blank(cuisine) || equalsIgnoreCase(r.getCuisine(), cuisine))
                .filter(r -> r.getRating() != null && r.getRating().doubleValue() >= rating)
                .map(r -> new RestaurantDTO(r.getRestaurantId(), r.getName(), r.getCuisine(),
                        r.getRating(), r.getLocation(), r.isOpen()))
                .toList();
    }

    @Override
    public List<MenuItemDTO> getMenuItems(long restaurantId) {
        return menuItemRepo.findByRestaurantId(restaurantId).stream()
                .map(m -> new MenuItemDTO(m.getMenuItemId(), m.getName(),
                        m.getDescription(), m.getPrice(), m.isAvailable()))
                .toList();
    }

    private static boolean blank(String s) { return s == null || s.isBlank(); }

    private static boolean contains(String field, String q) {
        return field != null && field.toLowerCase().contains(q.toLowerCase());
    }

    private static boolean equalsIgnoreCase(String field, String q) {
        return field != null && field.equalsIgnoreCase(q);
    }
}

/** «Proxy» — 60s TTL cache in front of the real service (holds search P99 < 300 ms). */
@Service
@Primary
public class RestaurantCacheProxy implements IRestaurantService {

    private static final Logger log = LoggerFactory.getLogger(RestaurantCacheProxy.class);
    private static final long TTL_MS = 60_000;

    private final RestaurantService real;                          // UML: -realService
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

    public RestaurantCacheProxy(RestaurantService real) {
        this.real = real;
    }

    @Override
    public List<RestaurantDTO> searchRestaurants(String loc, String cuisine, double rating) {
        String key = norm(loc) + "|" + norm(cuisine) + "|" + rating;
        CacheEntry hit = cache.get(key);
        if (hit != null && !hit.isExpired()) {                     // DT-M1-3 C1: cache hit?
            log.debug("CACHE HIT — key={}", key);
            return hit.data();                                     // R1 → A1
        }
        List<RestaurantDTO> fresh = real.searchRestaurants(loc, cuisine, rating); // miss → A2
        cache.put(key, new CacheEntry(fresh, System.currentTimeMillis()));
        return fresh;
    }

    @Override
    public List<MenuItemDTO> getMenuItems(long restaurantId) {
        return real.getMenuItems(restaurantId);                   // menus change rarely — direct
    }

    private static String norm(String s) { return s == null ? "" : s.trim().toLowerCase(); }

    private record CacheEntry(List<RestaurantDTO> data, long storedAt) {
        boolean isExpired() { return System.currentTimeMillis() - storedAt > TTL_MS; }
    }
}
