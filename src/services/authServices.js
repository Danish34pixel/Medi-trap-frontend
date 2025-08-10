import axiosInstance from "../utils/Axios";

export const loginUser = async(userData)=>{
    try {
        const res = await axiosInstance.post("/auth/login", userData);
        console.log("User logged in:", res.data.user);
        return res.data;
    } catch (err) {
        console.error("Error logging in user:", err);
        throw err;
    }
}

export const registerUser = async(userData)=>{
    try {
        const res = await axiosInstance.post("/auth/signup", userData);
        console.log("User registered:", res.data.user);
        return res.data;
    } catch (err) {
        console.error("Error registering user:", err);
        throw err;
    }
}

export const logoutUser = async()=>{
    try {
        const res = await axiosInstance.get("/auth/logout");
        console.log("User logged out");
        return res.data;
    } catch (err) {
        console.error("Error logging out user:", err);
        throw err;
    }
}