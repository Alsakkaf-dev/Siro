package com.grouphub.ofd.restaurant;

import com.grouphub.ofd.common.dto.MenuItemDTO;
import com.grouphub.ofd.common.dto.RestaurantDTO;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Browsing endpoints (SDD §6.1). Injects the IRestaurantService interface, which
 * Spring resolves to the @Primary RestaurantCacheProxy (Proxy pattern).
 */
@RestController
@RequestMapping("/api/restaurants")
public class RestaurantController {

    private final IRestaurantService restaurantService;   // resolves to RestaurantCacheProxy

    public RestaurantController(IRestaurantService restaurantService) {
        this.restaurantService = restaurantService;
    }

    /** DT-M1-3 — search. rating is treated as a minimum (>=); all params optional. */
    @GetMapping
    public Map<String, Object> search(@RequestParam(required = false) String loc,
                                      @RequestParam(required = false) String cuisine,
                                      @RequestParam(required = false, defaultValue = "0") double rating) {
        List<RestaurantDTO> results = restaurantService.searchRestaurants(loc, cuisine, rating);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("results", results);
        if (results.isEmpty())
            body.put("message", "No restaurants — widen radius");   // DT-M1-3 R2 → A3
        return body;
    }

    /** DT-M1-3 A5 — render a restaurant's menu (Proxy delegates directly). */
    @GetMapping("/{id}/menu")
    public List<MenuItemDTO> menu(@PathVariable long id) {
        return restaurantService.getMenuItems(id);
    }
}
