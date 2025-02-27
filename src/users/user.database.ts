import { User, UnitUser, Users } from "./user.interface";
import bcrypt from "bcryptjs";
import { v4 as random } from "uuid";
import fs from "fs";

let users: Users = loadUsers();

function loadUsers(): Users {
    try {
        const data = fs.readFileSync("./users.json", "utf-8");
        return JSON.parse(data);
    } catch (error) {
        console.log(`Error: ${error}`);
        return {};
    }
}

function saveUsers() {
    try {
        fs.writeFileSync("./users.json", JSON.stringify(users), { encoding: "utf-8" });
        console.log('Users saved successfully!');
    } catch (error) {
        console.log(`Error: ${error}`);
    }
}

export const findAll = async (): Promise<UnitUser[]> => Object.values(users);

export const findOne = async (id: string): Promise<UnitUser | null> => users[id] || null;

export const create = async (userData: User): Promise<UnitUser | null> => {
    let id = random();
    let check_user = await findOne(id);

    while (check_user) {
        id = random();
        check_user = await findOne(id);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const user: UnitUser = {
        id: id,
        username: userData.username,
        email: userData.email,
        password: hashedPassword
    };

    users[id] = user;
    saveUsers();

    return user;
};

export const findByEmail = async (user_email: string): Promise<UnitUser | null> => {
    const allUsers = await findAll();
    return allUsers.find(user => user.email === user_email) || null;
};

export const comparePassword = async (email: string, supplied_password: string): Promise<null | UnitUser> => {
    const user = await findByEmail(email);
    if (!user) return null;

    const isMatch = await bcrypt.compare(supplied_password, user.password);
    return isMatch ? user : null;
};

export const update = async (id: string, updateValues: Partial<User>): Promise<UnitUser | null> => {
    const userExists = await findOne(id);
    if (!userExists) return null;

    if (updateValues.password) {
        const salt = await bcrypt.genSalt(10);
        updateValues.password = await bcrypt.hash(updateValues.password, salt);
    }

    users[id] = { ...userExists, ...updateValues };
    saveUsers();
    return users[id];
};

export const remove = async (id: string): Promise<void> => {
    if (!(id in users)) return;
    delete users[id];
    saveUsers();
};
