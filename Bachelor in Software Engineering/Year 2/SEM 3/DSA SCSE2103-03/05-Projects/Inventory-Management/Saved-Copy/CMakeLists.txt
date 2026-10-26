cmake_minimum_required(VERSION 3.28)
project(inventory_management_system)

set(CMAKE_CXX_STANDARD 23)  # or 20; MSVC does NOT support "26" yet
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(inventory_management_system
        src/main.cpp
)

# Tell CMake which files are C++20 module interfaces
target_sources(inventory_management_system
        PUBLIC
        FILE_SET cxx_modules TYPE CXX_MODULES FILES
        src/model/Stock.cppm
        src/model/User.cppm
        src/model/UserRole.cppm

        src/controller/AdminController.cppm
        src/controller/AuthController.cppm
        src/controller/InventoryController.cppm

        src/service/AdminService.cppm
        src/service/AuthService.cppm
        src/service/InventoryService.cppm

        src/repository/UserRepository.cppm
        src/repository/InventoryRepository.cppm

        src/view/AdminView.cppm
        src/view/AuthView.cppm
        src/view/InventoryView.cppm
        src/view/MainView.cppm

        src/utility/Algorithm.cppm
        src/utility/InputValidator.cppm
        src/utility/TxtUtils.cppm
)