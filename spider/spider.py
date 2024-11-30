from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import pandas as pd
import time
from datetime import datetime

def get_articles():
    print("正在初始化Chrome浏览器...")
    # 设置 Chrome 选项
    chrome_options = webdriver.ChromeOptions()
    # 性能优化选项
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-extensions')
    chrome_options.add_argument('--disable-browser-side-navigation')
    chrome_options.add_argument('--disable-infobars')
    # 反爬虫选项
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    # 添加更多反爬虫选项
    chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
    chrome_options.add_argument('--disable-web-security')
    chrome_options.add_argument('--disable-features=IsolateOrigins,site-per-process')
    
    # 初始化Chrome浏览器
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    # 修改 window.navigator.webdriver 标记
    driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
        "source": """
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            })
        """
    })
    
    # 存储所有文章信息
    all_articles = []
    
    try:
        print("正在访问搜狗微信搜索页面...")
        driver.get("https://weixin.sogou.com/")
        
        print("等待页面加载...")
        time.sleep(3)
        
        # 截图保存
        driver.save_screenshot("debug_screenshot.png")
        print("已保存页面截图到 debug_screenshot.png")
        
        print("查找搜索框...")
        search_box = WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.ID, "query"))
        )
        print("搜索框已找到，正在输入关键词...")
        search_box.clear()
        search_box.send_keys("AI")
        
        # 尝试多种方式查找搜索按钮
        print("查找搜索按钮...")
        try:
            # 方法1：通过class名查找
            search_button = driver.find_element(By.CLASS_NAME, "swz")
        except:
            try:
                # 方法2：通过XPath查找搜索按钮
                search_button = driver.find_element(By.XPATH, "//input[@type='submit']")
            except:
                try:
                    # 方法3：通过更通用的选择器
                    search_button = driver.find_element(By.CSS_SELECTOR, "input[value='搜文章']")
                except:
                    try:
                        # 方法4：通过按钮文本查找
                        search_button = driver.find_element(By.XPATH, "//button[contains(text(), '搜索')]")
                    except:
                        try:
                            # 方法5：通过form提交
                            print("尝试直接提交表单...")
                            search_form = driver.find_element(By.TAG_NAME, "form")
                            search_form.submit()
                        except:
                            print("无法找到搜索按钮，尝试使用回车键搜索...")
                            search_box.send_keys(Keys.RETURN)
                    else:
                        print("找到搜索按钮（方法4），点击...")
                        search_button.click()
                else:
                    print("找到搜索按钮（方法3），点击...")
                    search_button.click()
            else:
                print("找到搜索按钮（方法2），点击...")
                search_button.click()
        else:
            print("找到搜索按钮（方法1），点击...")
            search_button.click()
        
        # 增加等待时间，确保搜索结果完全加载
        print("等待搜索结果加载...")
        time.sleep(10)
        
        # 保存搜索后的页面截图
        driver.save_screenshot("after_search.png")
        print("已保存搜索后的页面截图")
        
        # 保存页面源码以便分析
        with open("search_page.html", "w", encoding="utf-8") as f:
            f.write(driver.page_source)
        print("已保存搜索页面源码")
        
        # 爬取5页内容
        for page in range(1, 6):
            print(f"正在爬取第{page}页...")
            
            try:
                print("尝试查找文章列表...")
                # 等待搜索结果容器加载
                WebDriverWait(driver, 20).until(
                    EC.presence_of_element_located((By.CLASS_NAME, "main-left"))
                )
                
                # 获取页面源码并保存
                with open(f"page_{page}_source.html", "w", encoding="utf-8") as f:
                    f.write(driver.page_source)
                print(f"已保存第{page}页源码")
                
                # 尝试多种方式获取文章列表
                articles = []
                selectors = [
                    "//div[contains(@class, 'txt-box')]",  # XPath for txt-box
                    "//li[contains(@class, 'news-list')]/div",  # XPath for news items
                    "//div[contains(@class, 'news-box')]",  # XPath for news-box
                ]
                
                for selector in selectors:
                    try:
                        articles = driver.find_elements(By.XPATH, selector)
                        if len(articles) > 0:
                            print(f"使用选择器 {selector} 找到 {len(articles)} 篇文章")
                            break
                    except Exception as e:
                        print(f"选择器 {selector} 未找到文章: {str(e)}")
                
                if len(articles) == 0:
                    print("警告：未找到任何文章，尝试其他方法...")
                    # 保存截图以便调试
                    driver.save_screenshot(f"no_articles_page_{page}.png")
                    continue
                
                for article in articles:
                    try:
                        # 获取文章HTML用于调试
                        article_html = article.get_attribute('outerHTML')
                        print("\n当前文章HTML:")
                        print(article_html)
                        
                        # 提取文章信息
                        title = ""
                        link = ""
                        
                        # 尝试多种方式获取标题和链接
                        title_selectors = [
                            ".//h3/a",
                            ".//h4/a",
                            ".//a[contains(@uigs, 'article_title')]"
                        ]
                        
                        for selector in title_selectors:
                            try:
                                title_element = article.find_element(By.XPATH, selector)
                                title = title_element.text
                                link = title_element.get_attribute("href")
                                if title and link:
                                    break
                            except:
                                continue
                        
                        if not (title and link):
                            print("未找到标题或链接，跳过此文章")
                            continue
                            
                        # 获取摘要
                        try:
                            summary = article.find_element(By.CLASS_NAME, "txt-info").text
                        except:
                            try:
                                summary = article.find_element(By.CLASS_NAME, "s-p").text
                            except:
                                summary = "无摘要"
                        
                        # 获取来源
                        try:
                            # 方法1：通过account类名获取
                            source = article.find_element(By.CLASS_NAME, "account").text
                        except:
                            try:
                                # 方法2：通过wx-name类名获取
                                source = article.find_element(By.CLASS_NAME, "wx-name").text
                            except:
                                try:
                                    # 方法3：通过特定的XPath获取
                                    source = article.find_element(By.XPATH, ".//div[contains(@class, 'account') or contains(@class, 'wx-name') or contains(@class, 'author')]").text
                                except:
                                    try:
                                        # 方法4：通过data-username属性获取
                                        source = article.find_element(By.CSS_SELECTOR, "[data-username]").text
                                    except:
                                        try:
                                            # 方法5：查找包含微信号的链接
                                            source = article.find_element(By.XPATH, ".//a[contains(@title, '微信号')]").text
                                        except:
                                            source = "未知来源"
                        
                        if title and link:  # 只保存有标题和链接的文章
                            all_articles.append({
                                "标题": title,
                                "摘要": summary,
                                "链接": link,
                                "来源": source
                            })
                            print(f"成功提取文章: {title[:20]}...")
                        
                    except Exception as e:
                        print(f"提取文章信息时出错: {str(e)}")
                        continue
                
                # 如果不是最后一页，点击下一页
                if page < 5:
                    try:
                        next_page = WebDriverWait(driver, 10).until(
                            EC.element_to_be_clickable((By.ID, "sogou_next"))
                        )
                        driver.execute_script("arguments[0].scrollIntoView();", next_page)
                        time.sleep(1)
                        next_page.click()
                        print("已点击下一页")
                        time.sleep(5)
                    except Exception as e:
                        print(f"翻页时出错: {str(e)}")
                        break
                        
            except Exception as e:
                print(f"处理第{page}页时出错: {str(e)}")
                driver.save_screenshot(f"error_page_{page}.png")
                continue
                    
    except Exception as e:
        print(f"发生错误: {str(e)}")
        driver.save_screenshot("error.png")
    
    finally:
        # 关闭浏览器
        driver.quit()
        
    return all_articles

def save_to_excel(articles):
    # 创建DataFrame
    df = pd.DataFrame(articles)
    
    # 生成文件名（包含当前时间）
    current_time = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"AI微信_{current_time}.xlsx"
    
    # 保存到Excel，移除encoding参数
    df.to_excel(filename, index=False)
    print(f"数据已保存到文件: {filename}")

if __name__ == "__main__":
    print("开始爬取微信公众号文章...")
    articles = get_articles()
    if articles:
        save_to_excel(articles)
    print("爬取完成！") 