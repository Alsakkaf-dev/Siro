# Assignment 2 — PlantUML Diagram Source Code
**Project:** Online Food Delivery System — Software Design Description (SDD)
**Group:** Hub (Group 11) · SCSE2233 Software Design and Architecture

> **How to use this file:** Copy each fenced `plantuml` block, paste it into a renderer
> (https://www.plantuml.com/plantuml , the VS Code *PlantUML* extension, or IntelliJ),
> export the image, and paste it into the matching **[Insert ... Diagram Here]** placeholder
> box inside `Assignment2_SDD_OnlineFoodDelivery.docx`. The heading above each block names
> the exact document section and figure number it belongs to.

---

## 1. Figure 5.2.1 — Use Case Diagram (Context Viewpoint §5.2.2)

```plantuml
@startuml UseCaseDiagram
left to right direction
skinparam packageStyle rectangle
skinparam shadowing false
skinparam actorStyle awesome

actor "Customer"          as CUST
actor "Admin"             as ADMIN
actor "Delivery Driver"   as DRIVER
actor "Payment Gateway\n(Stripe)" as PG
actor "Email / Notification\nService" as EMAIL

rectangle "Online Food Delivery System" {
  usecase "UC001\nRegister / Login"            as UC1
  usecase "UC002\nBrowse Restaurants & Menu"   as UC2
  usecase "UC003\nAdd Items to Cart"           as UC3
  usecase "UC004\nPlace Order & Confirm"       as UC4
  usecase "UC005\nProcess Payment"             as UC5
  usecase "UC006\nTrack Delivery in Real Time" as UC6
  usecase "UC007\nManage Restaurants & Fleet"  as UC7
}

CUST --> UC1
CUST --> UC2
CUST --> UC3
CUST --> UC4
CUST --> UC5
CUST --> UC6

ADMIN  --> UC7
DRIVER --> UC6

UC5 ..> PG    : <<include>>
UC1 ..> EMAIL : <<include>>
UC4 ..> EMAIL : <<include>>
UC5 ..> EMAIL : <<include>>
UC6 ..> EMAIL : <<include>>

note bottom of UC3
  <<extend>> : "Update Cart Quantity"
end note
@enduml
```

---

## 2. Figure 5.3.1 — Microservices Architecture / Component Diagram (Structure Viewpoint §5.3.2)

```plantuml
@startuml ArchitectureStyle
skinparam componentStyle rectangle
skinparam shadowing false
skinparam linetype ortho

actor Customer
actor Admin
actor Driver

node "Client Tier" {
  [Web / Mobile App] as WEB
}

[API Gateway\n(REST + WebSocket)] as GW

package "Microservices (independently deployable)" {
  [Auth Service]         as AUTH
  [Restaurant Service]   as REST
  [Cart & Order Service] as CART
  [Payment Service]      as PAY
  [Delivery & Tracking\nService] as DEL
  [Admin Service]        as ADM
  [Notification Service] as NOTIF
}

queue "Event Bus\n(async messaging)" as BUS

database "UserDB"        as UDB
database "RestaurantDB"  as RDB
database "OrderDB"       as ODB
database "PaymentDB"     as PDB
database "DeliveryDB"    as DDB

cloud "Stripe Payment\nGateway (external)" as STRIPE

Customer --> WEB
Admin    --> WEB
Driver   --> WEB
WEB      --> GW

GW --> AUTH
GW --> REST
GW --> CART
GW --> PAY
GW --> DEL
GW --> ADM

AUTH --> UDB
REST --> RDB
CART --> ODB
PAY  --> PDB
DEL  --> DDB

PAY  --> STRIPE : HTTPS / tokenised
CART ..> BUS    : OrderCreated
PAY  ..> BUS    : PaymentApproved
DEL  ..> BUS    : DeliveryDispatched
BUS  ..> NOTIF  : async events
DEL  --> WEB    : WebSocket GPS push

note right of PAY
  PCI-scoped network segment
  (isolated blast radius)
end note
@enduml
```

---

## 3. Figure 5.4.1 — Entity Relationship Diagram (Information Viewpoint §5.4.2)

```plantuml
@startuml ERD
skinparam linetype ortho
hide circle

entity "USER" as USER {
  * user_id : BIGINT <<PK>>
  --
  name : VARCHAR(120)
  email : VARCHAR(160) <<UQ>>
  password_hash : VARCHAR(255)
  phone : VARCHAR(20)
  role : ENUM
  created_at : TIMESTAMP
}

entity "RESTAURANT" as REST {
  * restaurant_id : BIGINT <<PK>>
  --
  name : VARCHAR(150)
  cuisine : VARCHAR(60)
  rating : DECIMAL(2,1)
  is_open : BOOLEAN
  location : VARCHAR(255)
}

entity "MENU_ITEM" as MENU {
  * menu_item_id : BIGINT <<PK>>
  --
  # restaurant_id : BIGINT <<FK>>
  name : VARCHAR(150)
  description : TEXT
  price : DECIMAL(10,2)
  is_available : BOOLEAN
}

entity "CART" as CART {
  * cart_id : BIGINT <<PK>>
  --
  # user_id : BIGINT <<FK>>
  status : ENUM
  subtotal : DECIMAL(10,2)
  updated_at : TIMESTAMP
}

entity "CART_ITEM" as CITEM {
  * cart_item_id : BIGINT <<PK>>
  --
  # cart_id : BIGINT <<FK>>
  # menu_item_id : BIGINT <<FK>>
  quantity : INT
  unit_price : DECIMAL(10,2)
}

entity "ORDERS" as ORD {
  * order_id : BIGINT <<PK>>
  --
  # user_id : BIGINT <<FK>>
  # cart_id : BIGINT <<FK>>
  delivery_address : VARCHAR(255)
  total_amount : DECIMAL(10,2)
  status : ENUM
  created_at : TIMESTAMP
}

entity "TRANSACTION" as TXN {
  * transaction_id : BIGINT <<PK>>
  --
  # order_id : BIGINT <<FK>>
  gateway_ref : VARCHAR(120)
  amount : DECIMAL(10,2)
  currency : CHAR(3)
  status : ENUM
  paid_at : TIMESTAMP
}

entity "DELIVERY" as DELV {
  * delivery_id : BIGINT <<PK>>
  --
  # order_id : BIGINT <<FK>>
  # driver_id : BIGINT <<FK>>
  status : ENUM
  current_lat : DECIMAL(9,6)
  current_lng : DECIMAL(9,6)
  eta : TIMESTAMP
}

entity "DRIVER" as DRV {
  * driver_id : BIGINT <<PK>>
  --
  name : VARCHAR(120)
  phone : VARCHAR(20)
  vehicle : VARCHAR(60)
  is_active : BOOLEAN
}

USER  ||--o{ CART   : owns
USER  ||--o{ ORD    : places
REST  ||--o{ MENU   : offers
CART  ||--o{ CITEM  : contains
MENU  ||--o{ CITEM  : "referenced by"
CART  ||--|| ORD    : "converts to"
ORD   ||--|| TXN    : "paid by"
ORD   ||--|| DELV   : "fulfilled by"
DRV   ||--o{ DELV   : "assigned to"
@enduml
```

---

## 4. Figure 5.5.1 — UI Wireframes (Interface Viewpoint §5.5.2 / §6)

> Rendered with PlantUML **Salt**. Four key screens on one canvas.

```plantuml
@startsalt WireframeLogin
{+
  <b>Login / Register
  ==
  Email    | "                    "
  Password | "****                "
  [  Log In  ] | [ Register ]
  --
  "Forgot password?"
}
@endsalt
```

```plantuml
@startsalt WireframeBrowse
{+
  <b>Browse Restaurants
  ==
  { Search: | "pizza near me     " | [ Filter v ] }
  --
  { | <b>Mario's Pizza   | * 4.7 | 25 min }
  { | <b>Sushi Hub       | * 4.5 | 30 min }
  { | <b>Burger Town     | * 4.2 | 20 min }
  --
  [ View Menu ]
}
@endsalt
```

```plantuml
@startsalt WireframeCart
{+
  <b>Your Cart
  ==
  { Margherita Pizza | x2 | RM 30.00 }
  { Garlic Bread     | x1 | RM  8.00 }
  --
  { Subtotal: | RM 38.00 }
  { Delivery: | RM  5.00 }
  { <b>Total:  | <b>RM 43.00 }
  --
  [ Proceed to Checkout ]
}
@endsalt
```

```plantuml
@startsalt WireframeTracking
{+
  <b>Track Order #10245
  ==
  {#
   .  | .  | .
   .  | <&map-marker> | .
   .  | .  | .
  }
  --
  Status: | <b>Out for Delivery
  ETA:    | <b>12 min
  --
  [ Contact Driver ]
}
@endsalt
```

---

## 5. Logical Viewpoint — Pattern-Injected Class Diagrams (§5.6.2)

### 5a. Figure 5.6.1 — Module 1 Class Diagram (Singleton + Proxy + Strategy) — Mohammed Alsakkaf

```plantuml
@startuml M1_ClassDiagram
skinparam classAttributeIconSize 0
skinparam shadowing false

' ===== SINGLETON (Creational) =====
class ConfigurationManager <<Singleton>> {
  - {static} instance : ConfigurationManager
  - jwtSecret : String
  - sessionTtl : int
  - ConfigurationManager()
  + {static} getInstance() : ConfigurationManager
  + get(key : String) : String
}

' ===== STRATEGY (Behavioral) =====
interface AuthenticationStrategy <<Strategy>> {
  + authenticate(credentials : AuthRequest) : AuthResult
}
class PasswordAuthStrategy {
  + authenticate(credentials : AuthRequest) : AuthResult
}
class OAuthStrategy {
  + authenticate(credentials : AuthRequest) : AuthResult
}

class AuthService {
  - strategy : AuthenticationStrategy
  + setStrategy(s : AuthenticationStrategy) : void
  + authenticate(email : String, password : String) : AuthResult
  + verifyPasswordHash(input : String, hash : String) : boolean
  + createSession(userId : long) : String
}

interface UserRepository {
  + findByEmail(email : String) : User
  + save(user : User) : User
  + createSession(userId : long) : String
}
class UserRepositoryImpl
class User {
  - userId : long
  - name : String
  - email : String
  - passwordHash : String
  - role : Role
}

' ===== PROXY (Structural) =====
interface IRestaurantService <<Subject>> {
  + searchRestaurants(loc : String, cuisine : String, rating : double) : List<RestaurantDTO>
  + getMenuItems(restaurantId : long) : List<MenuItemDTO>
}
class RestaurantService {
  + searchRestaurants(loc : String, cuisine : String, rating : double) : List<RestaurantDTO>
  + getMenuItems(restaurantId : long) : List<MenuItemDTO>
  + queryRestaurants(filters : Filter) : List<Restaurant>
  + fetchMenu(restaurantId : long) : List<MenuItem>
}
class RestaurantCacheProxy <<Proxy>> {
  - realService : RestaurantService
  - cache : Map<String, List<RestaurantDTO>>
  + searchRestaurants(loc : String, cuisine : String, rating : double) : List<RestaurantDTO>
  + getMenuItems(restaurantId : long) : List<MenuItemDTO>
}
class Restaurant {
  - restaurantId : long
  - name : String
  - cuisine : String
  - rating : double
  - isOpen : boolean
}
class MenuItem {
  - menuItemId : long
  - name : String
  - price : double
  - isAvailable : boolean
}

AuthenticationStrategy <|.. PasswordAuthStrategy
AuthenticationStrategy <|.. OAuthStrategy
AuthService o--> AuthenticationStrategy : strategy
AuthService ..> ConfigurationManager : reads
AuthService --> UserRepository
UserRepository <|.. UserRepositoryImpl
UserRepositoryImpl ..> User

IRestaurantService <|.. RestaurantService
IRestaurantService <|.. RestaurantCacheProxy
RestaurantCacheProxy o--> RestaurantService : realService
RestaurantService ..> Restaurant
Restaurant "1" *-- "many" MenuItem
@enduml
```

### 5b. Figure 5.6.2 — Module 2 Class Diagram (Builder + Facade + State) — Anas Ahmed Hisham

```plantuml
@startuml M2_ClassDiagram
skinparam classAttributeIconSize 0
skinparam shadowing false

' ===== FACADE (Structural) =====
class CheckoutFacade <<Facade>> {
  - cartService : CartService
  - inventoryService : InventoryService
  - orderService : OrderService
  + checkout(cartId : long, address : String) : OrderSummaryDTO
}

class CartService {
  + addItem(customerId : long, menuItemId : long, qty : int) : CartDTO
  + createCartItem(menuItemId : long, qty : int, unitPrice : double) : CartItem
  + updateCartTotal() : void
  + validateCart(cartId : long) : boolean
  + reserveInventory(items : List<CartItem>) : String
}
interface InventoryService {
  + checkAvailability(menuItemId : long, qty : int) : boolean
  + reserveInventory(items : List<CartItem>) : String
}
class ShoppingCart {
  - cartId : long
  - status : CartStatus
  - subtotal : double
}
class CartItem {
  - cartItemId : long
  - menuItemId : long
  - quantity : int
  - unitPrice : double
  + isValid() : boolean
}
interface CartRepository {
  + save(cart : ShoppingCart) : ShoppingCart
}
class CartRepositoryImpl

' ===== BUILDER (Creational) =====
class OrderBuilder <<Builder>> {
  - cartId : long
  - address : String
  - reservationId : String
  - items : List<CartItem>
  + withCart(cartId : long) : OrderBuilder
  + withAddress(addr : String) : OrderBuilder
  + withReservation(rsvId : String) : OrderBuilder
  + addItem(item : CartItem) : OrderBuilder
  + build() : Order
}
class OrderService {
  + createOrder(cartId : long, addr : String, rsvId : String) : Order
  + sendOrderConfirmation(orderId : long, customerId : long) : void
}

' ===== STATE (Behavioral) =====
interface OrderState <<State>> {
  + next(order : Order) : void
  + cancel(order : Order) : void
  + name() : String
}
class PendingPaymentState
class ConfirmedState
class OutForDeliveryState
class DeliveredState
class Order {
  - orderId : long
  - totalAmount : double
  - state : OrderState
  + setState(s : OrderState) : void
  + proceed() : void
}

CheckoutFacade o--> CartService
CheckoutFacade o--> InventoryService
CheckoutFacade o--> OrderService
CartService --> CartRepository
CartRepository <|.. CartRepositoryImpl
ShoppingCart "1" *-- "many" CartItem
CartService ..> ShoppingCart
OrderService ..> OrderBuilder : uses
OrderBuilder ..> Order : builds
Order o--> OrderState : state
OrderState <|.. PendingPaymentState
OrderState <|.. ConfirmedState
OrderState <|.. OutForDeliveryState
OrderState <|.. DeliveredState
@enduml
```

### 5c. Figure 5.6.3 — Module 3 Class Diagram (Factory Method + Adapter + Observer) — Imtiaj

```plantuml
@startuml M3_ClassDiagram
skinparam classAttributeIconSize 0
skinparam shadowing false

' ===== FACTORY METHOD (Creational) =====
abstract class PaymentGatewayFactory <<Factory>> {
  + {abstract} createGateway() : PaymentGateway
  + processPayment(orderId : long, token : String, amount : double) : PaymentConfirmation
}
class StripeGatewayFactory
class PayPalGatewayFactory

' ===== ADAPTER (Structural) =====
interface PaymentGateway <<Target>> {
  + chargeCard(token : String, amount : double, currency : String) : TransactionDTO
}
class StripeGatewayAdapter <<Adapter>> {
  - stripeApi : StripeExternalApi
  + chargeCard(token : String, amount : double, currency : String) : TransactionDTO
}
class StripeExternalApi <<Adaptee>> {
  + createCharge(payload : StripePayload) : StripeResponse
}
class PaymentService {
  + processPayment(orderId : long, token : String, amount : double) : PaymentConfirmation
  + validatePaymentRequest(amount : double, token : String) : boolean
  + recordTransaction(orderId : long, txId : String) : void
}
class Transaction {
  - transactionId : String
  - amount : double
  - status : TxStatus
}

' ===== OBSERVER (Behavioral) =====
interface DeliveryObserver <<Observer>> {
  + update(event : LocationEvent) : void
}
class CustomerTrackingClient
class NotificationObserver
class TrackingService <<Subject>> {
  - observers : List<DeliveryObserver>
  + subscribe(o : DeliveryObserver) : void
  + unsubscribe(o : DeliveryObserver) : void
  + broadcastLocation(orderId : long, gps : GpsCoord) : void
  + getDriverLocation(orderId : long) : GpsCoord
  + getETA(orderId : long) : long
}
class DeliveryService {
  + dispatchDelivery(orderId : long, restaurantId : long, addr : String) : void
  + queryDeliveryStatus(orderId : long) : DeliveryStatusDTO
}
class Driver {
  - driverId : long
  - name : String
  - currentLocation : GpsCoord
}

PaymentGatewayFactory <|-- StripeGatewayFactory
PaymentGatewayFactory <|-- PayPalGatewayFactory
StripeGatewayFactory ..> StripeGatewayAdapter : creates
PaymentGateway <|.. StripeGatewayAdapter
StripeGatewayAdapter o--> StripeExternalApi : adaptee
PaymentService --> PaymentGateway
PaymentService ..> Transaction

DeliveryObserver <|.. CustomerTrackingClient
DeliveryObserver <|.. NotificationObserver
TrackingService o--> "many" DeliveryObserver : observers
DeliveryService --> TrackingService
DeliveryService ..> Driver
@enduml
```

---

## 6. Interaction Viewpoint — Pattern-Aware Sequence Diagrams (§5.7.2)

### 6a. Figure 5.7.1 — SD001: Login & Browse (Strategy + Proxy) — Module 1

```plantuml
@startuml M1_Sequence
skinparam shadowing false
actor Customer
participant "WebApp" as WEB
participant "AuthService" as AUTH
participant "PasswordAuthStrategy" as STRAT
participant "ConfigurationManager" as CFG
participant "UserRepository" as UREPO
participant "RestaurantCacheProxy" as PROXY
participant "RestaurantService" as REST
database "RestaurantDB" as RDB

== Login Flow (Strategy + Singleton) ==
Customer -> WEB : enter email + password
WEB -> AUTH : authenticate(email, password)
AUTH -> CFG : getInstance().get("jwtSecret")
CFG --> AUTH : jwtSecret
AUTH -> STRAT : authenticate(credentials)
STRAT -> UREPO : findByEmail(email)
UREPO --> STRAT : user
STRAT -> STRAT : verifyPasswordHash(input, hash)
STRAT --> AUTH : AuthResult(success)
AUTH -> UREPO : createSession(userId)
UREPO --> AUTH : sessionToken
AUTH --> WEB : signed JWT
WEB --> Customer : redirect to home

== Browse Flow (Proxy caching) ==
Customer -> WEB : search(location, cuisine, rating)
WEB -> PROXY : searchRestaurants(loc, cuisine, rating)
alt cache hit
  PROXY --> WEB : cached List<RestaurantDTO>
else cache miss
  PROXY -> REST : searchRestaurants(loc, cuisine, rating)
  REST -> RDB : queryRestaurants(filters)
  RDB --> REST : List<Restaurant>
  REST --> PROXY : List<RestaurantDTO>
  PROXY -> PROXY : cache.put(key, result)
  PROXY --> WEB : List<RestaurantDTO>
end
WEB --> Customer : render restaurant list
@enduml
```

### 6b. Figure 5.7.2 — SD002: Add to Cart & Place Order (Facade + Builder + State) — Module 2

```plantuml
@startuml M2_Sequence
skinparam shadowing false
actor Customer
participant "WebApp" as WEB
participant "CheckoutFacade" as FACADE
participant "CartService" as CART
participant "InventoryService" as INV
participant "OrderBuilder" as BUILDER
participant "OrderService" as ORDER
participant "Order" as ORD
participant "NotificationService" as NOTIF

== Add to Cart ==
Customer -> WEB : addItem(menuItemId, qty)
WEB -> CART : addItem(customerId, menuItemId, qty)
CART -> INV : checkAvailability(menuItemId, qty)
INV --> CART : true
CART -> CART : createCartItem(menuItemId, qty, unitPrice)
CART -> CART : updateCartTotal()
CART --> WEB : CartDTO

== Place Order (Facade orchestration) ==
Customer -> WEB : checkout(cartId, address)
WEB -> FACADE : checkout(cartId, address)
FACADE -> CART : validateCart(cartId)
CART --> FACADE : valid
FACADE -> INV : reserveInventory(items)
INV --> FACADE : reservationId
FACADE -> ORDER : createOrder(cartId, address, reservationId)
ORDER -> BUILDER : withCart().withAddress().withReservation().build()
BUILDER --> ORDER : Order
ORDER -> ORD : setState(PendingPaymentState)
ORDER --> FACADE : OrderSummaryDTO
FACADE --> WEB : OrderSummaryDTO
WEB --> Customer : confirmation page
ORDER ->> NOTIF : sendOrderConfirmation(orderId, customerId) [async]

alt InsufficientStockException
  INV --> FACADE : throw InsufficientStockException
  FACADE --> WEB : error "item out of stock"
  WEB --> Customer : prompt to adjust cart
end
@enduml
```

### 6c. Figure 5.7.3 — SD003: Process Payment & Track Delivery (Factory + Adapter + Observer) — Module 3

```plantuml
@startuml M3_Sequence
skinparam shadowing false
actor Customer
participant "WebApp" as WEB
participant "PaymentGatewayFactory" as FACTORY
participant "PaymentService" as PAY
participant "StripeGatewayAdapter" as ADAPTER
participant "StripeExternalApi" as STRIPE
participant "DeliveryService" as DEL
participant "TrackingService" as TRACK
participant "CustomerTrackingClient" as CLIENT

== Payment (Factory Method + Adapter) ==
Customer -> WEB : payNow(orderId, cardToken, amount)
WEB -> FACTORY : createGateway()
FACTORY --> WEB : PaymentGateway (StripeGatewayAdapter)
WEB -> PAY : processPayment(orderId, cardToken, amount)
PAY -> PAY : validatePaymentRequest(amount, cardToken)
PAY -> ADAPTER : chargeCard(cardToken, amount, "MYR")
ADAPTER -> STRIPE : createCharge(payload)
STRIPE --> ADAPTER : StripeResponse(APPROVED)
ADAPTER --> PAY : TransactionDTO
PAY -> PAY : recordTransaction(orderId, txId)
PAY --> WEB : PaymentConfirmation
WEB --> Customer : "Payment Successful"
PAY ->> DEL : dispatchDelivery(orderId, restaurantId, address) [async]

== Track Delivery (Observer push) ==
Customer -> WEB : openTracking(orderId)
WEB -> TRACK : subscribe(CustomerTrackingClient)
loop every 10s
  TRACK -> TRACK : getDriverLocation(orderId)
  TRACK ->> CLIENT : update(LocationEvent) [WebSocket push]
  CLIENT --> Customer : animate driver marker + ETA
end
@enduml
```

---

## 7. Algorithm Viewpoint — Activity Diagram (§5.8.2)

### Figure 5.8.1 — Activity Diagram: End-to-End Order → Payment → Delivery

```plantuml
@startuml ActivityOrderToDelivery
skinparam shadowing false
start
:Customer proceeds to checkout;
:CheckoutFacade.validateCart(cartId);
if (cart valid and not empty?) then (yes)
  :reserveInventory(items);
  if (stock available?) then (yes)
    :OrderBuilder builds Order;
    :Order state = PENDING_PAYMENT;
    :Customer submits payment;
    :PaymentGatewayFactory.createGateway();
    :StripeGatewayAdapter.chargeCard();
    if (charge APPROVED?) then (yes)
      :recordTransaction();
      :Order state = CONFIRMED;
      :dispatchDelivery() [async];
      :TrackingService broadcasts GPS (Observer);
      :Order state = OUT_FOR_DELIVERY;
      :Driver marks delivered;
      :Order state = DELIVERED;
      :Prompt customer to rate driver;
      stop
    else (declined)
      :Notify "Payment declined";
      :Prompt alternate method;
      stop
    endif
  else (out of stock)
    :Throw InsufficientStockException;
    :Prompt customer to adjust cart;
    stop
  endif
else (invalid / empty)
  :Redirect to browse page;
  stop
endif
@enduml
```

### Figure 5.8.2 — State Machine Diagram: Order Lifecycle (supports the State pattern)

```plantuml
@startuml OrderStateMachine
skinparam shadowing false
[*] --> PENDING_PAYMENT : order created
PENDING_PAYMENT --> CONFIRMED : payment approved
PENDING_PAYMENT --> CANCELLED : payment failed / timeout
CONFIRMED --> OUT_FOR_DELIVERY : driver dispatched
OUT_FOR_DELIVERY --> DELIVERED : driver completes
DELIVERED --> [*]
CANCELLED --> [*]
@enduml
```

---

*End of PlantUML source. Every method shown in these diagrams matches a method in the
SDD class diagrams (§5.6) and the Java code samples (§5.6.2), and every message in the
sequence diagrams (§5.7) traces to one of those methods — see the Coherence Validation
tables in the main document.*
