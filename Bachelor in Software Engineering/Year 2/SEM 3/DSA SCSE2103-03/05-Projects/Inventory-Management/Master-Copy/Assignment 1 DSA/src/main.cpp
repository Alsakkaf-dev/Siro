import view.AuthView;
import view.AdminView;
import view.InventoryView;
import view.MainView;

import controller.AuthController;
import controller.AdminController;
import controller.InventoryController;

import repository.UserRepository;
import repository.InventoryRepository;

import service.AuthService;
import service.AdminService;
import service.InventoryService;

int main()
{
    UserRepository userRepository;
    InventoryRepository inventoryRepository;

    AuthService authService(userRepository);
    InventoryService inventoryService(inventoryRepository);
    AdminService adminService(inventoryRepository, inventoryService);

    AuthController authController(authService);
    AdminController adminController(adminService);
    InventoryController inventoryController(inventoryService);

    AdminView adminView(adminController);
    InventoryView inventoryView(inventoryController);
    AuthView authView(adminView, inventoryView, authController);
    MainView mainView(authView);

    mainView.showWelcomeScreen();
}
