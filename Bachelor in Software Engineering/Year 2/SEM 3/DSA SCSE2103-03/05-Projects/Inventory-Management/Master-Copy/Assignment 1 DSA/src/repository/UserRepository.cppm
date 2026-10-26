module;
#include <string>
#include <list>

export module repository.UserRepository;

import model.User;
import model.UserRole;
import utility.TxtParser;

export class UserRepository
{
private:
    const std::string PATH = "User.txt";
    std::list<User> users;

public:
    UserRepository()
    {
        users = TxtUtils::parseUserArrayFromTxt(PATH);
    }

    std::list<User> getUsers()
    {
        return users;
    }
};