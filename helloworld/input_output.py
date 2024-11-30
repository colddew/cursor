def get_user_info():
    # 从用户获取输入
    name = input("请输入你的名字：")
    age = input("请输入你的年龄：")
    return name, age

def calculate_birth_year(age):
    return 2024 - int(age)

def display_info(name, age, birth_year):
    print(f"你好，{name}！")
    print(f"你今年 {age} 岁了。")
    print(f"你大约出生在 {birth_year} 年。")

def main():
    # 获取用户信息
    name, age = get_user_info()
    
    # 计算出生年份
    birth_year = calculate_birth_year(age)
    
    # 显示信息
    display_info(name, age, birth_year)

if __name__ == "__main__":
    main() 