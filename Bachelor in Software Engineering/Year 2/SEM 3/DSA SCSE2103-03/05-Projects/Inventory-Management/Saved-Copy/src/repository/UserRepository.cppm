module;
#include <string>
#include <array>

export module repository.UserRepository;

import model.User;
import model.UserRole;
import utility.TxtParser;

export class UserRepository
{
private:
    const std::string PATH = "User.txt";
    std::array<User, 2> users;

public:
    UserRepository()
    {
        users = TxtUtils::parseUserArrayFromTxt(PATH);
    }

    std::array<User, 2> getUsers()
    {
        return users;
    }
};