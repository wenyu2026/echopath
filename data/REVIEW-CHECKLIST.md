# 来源人工核查清单

> **这份文件是给人用的，不是给 AI 用的。**
> 生成命令：`npm run review:sheet`　｜　每次改数据后重新生成。

## 怎么用

1. 从上往下逐条点开链接
2. 对照「这条来源支撑的 claim」，判断**原文是否真的支持这句话**
3. 在每条的 `结论` 行里改成下面三个之一：
   - `- [x] 已核` —— 原文确实支持
   - `- [!] 有出入` —— 原文和 claim 对不上（**必须在下面写清出入在哪**）
   - `- [~] 打不开` —— 链接失效或需要特殊访问
4. 全部核完后，把 `data/REVIEW.md` 顶部的「人类审核尚未完成」改成实际状态

## 进度

- 需要核查的来源：**36** 条（不含 AI 推断类）
- 这些来源支撑的 claim：**63** 条
- 平均每条来源 1.8 条 claim

> ⚠️ 自动工具只能查「链接能不能打开」（`npm run check:sources`）。
> **「原文是否支持这句话」只能人读** —— 这份清单就是为了让那一步尽量快。

---

### 1. `LX-TOHOKU`　鲁迅的仙台留学

- **机构**：东北大学史料馆
- **链接**：<https://www.archives.tohoku.ac.jp/luxun/cn/story/>
- **文献定位**：赴日与仙台入学、第二学年退学
- **已知局限**：机构或传记叙述，不能单独证明因果；未保存网页全文。

**这条来源支撑的 claim（2 条）：**

- [ ] 「第二学年离校，医学训练未完成。」　*（鲁迅（周树人） / lu_xun_1906_medicine_to_literature）*
- [ ] 「1902 留日与 1904 仙台入学。」　*（鲁迅（周树人） / lu_xun_1902_study_japan）*

```
# 结论（改成下面之一，并写清理由）
#   - [x] 已核 —— 原文确实支持
#   - [!] 有出入 —— 出入在哪：
#   - [~] 打不开 —— 情况：
```

---

### 2. `LX-SENDAI`　Chinese high school students visit Tohoku University

- **机构**：东北大学
- **链接**：<https://www.tohoku.ac.jp/en/news/university_news/sakura_exchange_program.html>
- **文献定位**：Lu Xun studied in Sendai from 1904 to 1906
- **已知局限**：机构或传记叙述，不能单独证明因果；未保存网页全文。

**这条来源支撑的 claim（2 条）：**

- [ ] 「在仙台学习为 1904—1906 年。」　*（鲁迅（周树人） / lu_xun_1906_medicine_to_literature）*
- [ ] 「仙台学习截止 1906。」　*（鲁迅（周树人） / lu_xun_1902_study_japan）*

```
# 结论（改成下面之一，并写清理由）
#   - [x] 已核 —— 原文确实支持
#   - [!] 有出入 —— 出入在哪：
#   - [~] 打不开 —— 情况：
```

---

### 3. `LX-PREFACE`　《呐喊》自序（1922）

- **机构**：鲁迅；维基文库转录
- **链接**：<https://zh.wikisource.org/wiki/吶喊>
- **文献定位**：自序：医学、筹办新生、金心异劝写文章
- **已知局限**：事后自述与开放转录；动机按本人表述处理，不当作现场心理记录。

**这条来源支撑的 claim（2 条）：**

- [ ] 「自述从医学转向文艺，筹刊失败。」　*（鲁迅（周树人） / lu_xun_1906_medicine_to_literature）*
- [ ] 「筹刊受挫、受劝写作和首篇狂人日记；自序落款 1922。」　*（鲁迅（周树人） / lu_xun_1918_write_new_youth）*

```
# 结论（改成下面之一，并写清理由）
#   - [x] 已核 —— 原文确实支持
#   - [!] 有出入 —— 出入在哪：
#   - [~] 打不开 —— 情况：
```

---

### 4. `LX-SELECT`　《自选集》自序（1932）

- **机构**：鲁迅；维基文库转录
- **链接**：<https://zh.wikisource.org/zh-hans/《自選集》自序>
- **文献定位**：我做小说，是开手于一九一八年
- **已知局限**：事后回忆；不是逐日决策日志。

**这条来源支撑的 claim（2 条）：**

- [ ] 「本人回顾 1918 年开始小说创作。」　*（鲁迅（周树人） / lu_xun_1902_study_japan）*
- [ ] 「1918 年开始小说创作。」　*（鲁迅（周树人） / lu_xun_1918_write_new_youth）*

```
# 结论（改成下面之一，并写清理由）
#   - [x] 已核 —— 原文确实支持
#   - [!] 有出入 —— 出入在哪：
#   - [~] 打不开 —— 情况：
```

---

### 5. `LX-MUSEUM`　鲁迅生平陈列：画出国人的魂灵

- **机构**：上海鲁迅纪念馆
- **链接**：<https://www.luxunmuseum.cn/>
- **文献定位**：1918—1922 年十四篇小说
- **已知局限**：机构或传记叙述，不能单独证明因果；未保存网页全文。**原深链（/lxcl/index/id/5.html）2026-10-02 实测 404（官网改版），已改为站点首页；具体展览页需到馆内检索，未能定位到对应条目。**

**这条来源支撑的 claim（2 条）：**

- [ ] 「后来的小说写作时间范围与结集。」　*（鲁迅（周树人） / lu_xun_1906_medicine_to_literature）*
- [ ] 「1918—1922 年篇目范围。」　*（鲁迅（周树人） / lu_xun_1918_write_new_youth）*

```
# 结论（改成下面之一，并写清理由）
#   - [x] 已核 —— 原文确实支持
#   - [!] 有出入 —— 出入在哪：
#   - [~] 打不开 —— 情况：
```

---

### 6. `AL-INTERVIEW`　李安｜聆听电影之神的声音

- **机构**：澎湃转载楚尘文化《李安访谈录》
- **链接**：<https://m.thepaper.cn/newsDetail_forward_27605082>
- **文献定位**：格伦·肯尼访谈：毕业后六年、1990 年剧本比赛、推手
- **已知局限**：中文译编的事后访谈；未将六年没有执导机会扩大成六年无任何正式工作。

**这条来源支撑的 claim（2 条）：**

- [ ] 「毕业后六年筹片、1990 年比赛和随后拍片。」　*（李安 / ang_lee_1984_six_years_persist）*
- [ ] 「1990 剧本比赛、随后获得制作机会。」　*（李安 / ang_lee_1990_script_competition）*

```
# 结论（改成下面之一，并写清理由）
#   - [x] 已核 —— 原文确实支持
#   - [!] 有出入 —— 出入在哪：
#   - [~] 打不开 —— 情况：
```

---

### 7. `AL-NYU`　Ang Lee — Tisch Gala 2024

- **机构**：纽约大学 Tisch
- **链接**：<https://tisch.nyu.edu/giving/the-tisch-gala/tisch-gala-2024/ang-lee.html>
- **文献定位**：1984 MFA、后续影片与奖项
- **已知局限**：页面把首部长片写在 1990 年；本集仅用来核对毕业与后续生涯，影片上映年采用访谈的 1991 年。

**这条来源支撑的 claim（2 条）：**

- [ ] 「1984 年电影 MFA；后续导演履历。」　*（李安 / ang_lee_1984_six_years_persist）*
- [ ] 「后续影片履历。」　*（李安 / ang_lee_1990_script_competition）*

```
# 结论（改成下面之一，并写清理由）
#   - [x] 已核 —— 原文确实支持
#   - [!] 有出入 —— 出入在哪：
#   - [~] 打不开 —— 情况：
```

---

### 8. `HM-SELF`　Haruki Murakami: The Moment I Became a Novelist

- **机构**：Haruki Murakami / Literary Hub / Knopf
- **链接**：<https://lithub.com/haruki-murakami-the-moment-i-became-a-novelist/>
- **文献定位**：1978 球赛、营业后写作、1979 首作、卖店专职
- **已知局限**：2015 年出版的自述节选；回顾性解释不代表 1978 年已有明确三年转行计划。

**这条来源支撑的 claim（2 条）：**

- [ ] 「1978 开始写作、1979 首作获奖，之后卖店及继续创作。」　*（村上春树 / murakami_1978_bar_and_writing）*
- [ ] 「前两部小说后出售生意及随后的创作。」　*（村上春树 / murakami_1981_fulltime_writing）*

```
# 结论（改成下面之一，并写清理由）
#   - [x] 已核 —— 原文确实支持
#   - [!] 有出入 —— 出入在哪：
#   - [~] 打不开 —— 情况：
```

---

### 9. `HM-1981`　Haruki Murakami

- **机构**：Biblioteca Salaborsa Ragazzi / Bologna
- **链接**：<https://www.bibliotecasalaborsa.it/ragazzi/profiles/profile-dd3b04>
- **文献定位**：Nel 1981 Murakami vende il jazz bar
- **已知局限**：公共图书馆的二手人物简介，仅补足卖店年份。

**这条来源支撑的 claim（2 条）：**

- [ ] 「卖店转向职业写作的年份为 1981 年。」　*（村上春树 / murakami_1978_bar_and_writing）*
- [ ] 「卖店年份 1981。」　*（村上春树 / murakami_1981_fulltime_writing）*

```
# 结论（改成下面之一，并写清理由）
#   - [x] 已核 —— 原文确实支持
#   - [!] 有出入 —— 出入在哪：
#   - [~] 打不开 —— 情况：
```

---

### 10. `CD-STUDY`　Darwin’s student booklist

- **机构**：Darwin Correspondence Project / Cambridge
- **链接**：<https://www.darwinproject.ac.uk/people/about-darwin/what-darwin-read/darwin-s-student-booklist>
- **文献定位**：Edinburgh 1825—1827；Cambridge January 1828
- **已知局限**：机构或传记叙述，不能单独证明因果；未保存网页全文。

**这条来源支撑的 claim（2 条）：**

- [ ] 「1825 入学、临床不适、1827 停学、1828 入剑桥。」　*（查尔斯·达尔文 / darwin_1825_medicine_trial）*
- [ ] 「1827 停医与 1828 年剑桥入学。」　*（查尔斯·达尔文 / darwin_1828_cambridge）*

```
# 结论（改成下面之一，并写清理由）
#   - [x] 已核 —— 原文确实支持
#   - [!] 有出入 —— 出入在哪：
#   - [~] 打不开 —— 情况：
```

---

### 11. `CD-CHURCH`　Darwin and the Church

- **机构**：Darwin Correspondence Project / Cambridge
- **链接**：<https://www.darwinproject.ac.uk/commentary/religion/darwin-and-church>
- **文献定位**：Cambridge degree and intended clerical career
- **已知局限**：机构或传记叙述，不能单独证明因果；未保存网页全文。

**这条来源支撑的 claim（2 条）：**

- [ ] 「学位与牧师职业的原有联系。」　*（查尔斯·达尔文 / darwin_1828_cambridge）*
- [ ] 「原有教会职业路径。」　*（查尔斯·达尔文 / darwin_1831_beagle）*

```
# 结论（改成下面之一，并写清理由）
#   - [x] 已核 —— 原文确实支持
#   - [!] 有出入 —— 出入在哪：
#   - [~] 打不开 —— 情况：
```

---

### 12. `CD-BEAGLE`　Voyage of HMS Beagle

- **机构**：Darwin Correspondence Project / Cambridge
- **链接**：<https://www.darwinproject.ac.uk/commentary/voyage-hms-beagle>
- **文献定位**：1831 邀请、父亲资助；1831-12-27 至 1836-10-02 航行
- **已知局限**：机构或传记叙述，不能单独证明因果；未保存网页全文。

**这条来源支撑的 claim（3 条）：**

- [ ] 「1831 年接受航行机会。」　*（查尔斯·达尔文 / darwin_1825_medicine_trial）*
- [ ] 「1831—1836 航行。」　*（查尔斯·达尔文 / darwin_1828_cambridge）*
- [ ] 「邀约、父亲资助与 1831—1836 航行。」　*（查尔斯·达尔文 / darwin_1831_beagle）*

```
# 结论（改成下面之一，并写清理由）
#   - [x] 已核 —— 原文确实支持
#   - [!] 有出入 —— 出入在哪：
#   - [~] 打不开 —— 情况：
```

---

### 13. `SJ-REED`　Steve Jobs and Reed College

- **机构**：Reed College
- **链接**：<https://www.reed.edu/about/steve-jobs.html>
- **文献定位**：fall 1972；one semester；auditing classes
- **已知局限**：机构或传记叙述，不能单独证明因果；未保存网页全文。

**这条来源支撑的 claim（1 条）：**

- [ ] 「1972 年秋入学，一学期后退学并旁听。」　*（史蒂夫·乔布斯 / jobs_1972_reed_dropout）*

```
# 结论（改成下面之一，并写清理由）
#   - [x] 已核 —— 原文确实支持
#   - [!] 有出入 —— 出入在哪：
#   - [~] 打不开 —— 情况：
```

---

### 14. `SJ-SPEECH`　‘You’ve got to find what you love,’ Jobs says

- **机构**：Steve Jobs / Stanford University
- **链接**：<https://news.stanford.edu/stories/2005/06/youve-got-find-love-jobs-says>
- **⚠️ 自动工具打不开**：该域名有反爬，必须用普通浏览器点一次
- **文献定位**：2005 毕业演讲：退学与重启事业两部分
- **已知局限**：预备演讲稿，动机与意义归本人回顾；不把退学认定为创业成功原因。

**这条来源支撑的 claim（2 条）：**

- [ ] 「退学后的生活、自述动机及事后解释。」　*（史蒂夫·乔布斯 / jobs_1972_reed_dropout）*
- [ ] 「三十岁离开、随后 NeXT/Pixar 及回归的自述。」　*（史蒂夫·乔布斯 / jobs_1985_restart）*

```
# 结论（改成下面之一，并写清理由）
#   - [x] 已核 —— 原文确实支持
#   - [!] 有出入 —— 出入在哪：
#   - [~] 打不开 —— 情况：
```

---

### 15. `JB-SPEECH`　2010 Baccalaureate remarks

- **机构**：Jeff Bezos / Princeton University
- **链接**：<https://www.princeton.edu/news/2010/05/30/2010-baccalaureate-remarks>
- **⚠️ 自动工具打不开**：该域名有反爬，必须用普通浏览器点一次
- **文献定位**：16 years ago、老板要求考虑 48 小时、离职创建 Amazon
- **已知局限**：创业者事后回忆；没有未创业的对照结局。

**这条来源支撑的 claim（1 条）：**

- [ ] 「2010 演讲回顾 16 年前离职、妻子支持及老板建议再考虑。」　*（杰夫·贝索斯 / bezos_1994_leave_finance）*

```
# 结论（改成下面之一，并写清理由）
#   - [x] 已核 —— 原文确实支持
#   - [!] 有出入 —— 出入在哪：
#   - [~] 打不开 —— 情况：
```

---

### 16. `BM-LJMU`　Brian May profile

- **机构**：Liverpool John Moores University
- **链接**：<https://www.ljmu.ac.uk/about-us/bicentenary/our-people/brian-may/brian-may-profile>
- **文献定位**：1974 中断博士，2006 重返，2007 取得博士
- **已知局限**：机构或传记叙述，不能单独证明因果；未保存网页全文。

**这条来源支撑的 claim（2 条）：**

- [ ] 「1974 中断研究、2006 恢复、2007 完成。」　*（布赖恩·梅 / may_1974_pause_phd）*
- [ ] 「2006 恢复和 2007 完成。」　*（布赖恩·梅 / may_2006_resume_phd）*

```
# 结论（改成下面之一，并写清理由）
#   - [x] 已核 —— 原文确实支持
#   - [!] 有出入 —— 出入在哪：
#   - [~] 打不开 —— 情况：
```

---

### 17. `BM-IMPERIAL`　Annual Alumni Lecture 2007

- **机构**：Imperial College London
- **链接**：<https://www.imperial.ac.uk/news/30594/annual-alumni-lecture-2007/>
- **文献定位**：2006 决定恢复、三十年文献补读、2007 年八月论文
- **已知局限**：机构或传记叙述，不能单独证明因果；未保存网页全文。

**这条来源支撑的 claim（1 条）：**

- [ ] 「旧研究材料、文献补读及论文提交。」　*（布赖恩·梅 / may_2006_resume_phd）*

```
# 结论（改成下面之一，并写清理由）
#   - [x] 已核 —— 原文确实支持
#   - [!] 有出入 —— 出入在哪：
#   - [~] 打不开 —— 情况：
```

---

### 18. `VR-AUTO`　Venkatraman Ramakrishnan — Biographical

- **机构**：Nobel Prize / Venki Ramakrishnan
- **链接**：<https://www.nobelprize.org/prizes/chemistry/2009/ramakrishnan/biographical/>
- **文献定位**：1976 UCSD、1978 Yale、1999 LMB
- **已知局限**：直接打开受站点限制；已核对搜索索引中的长段正文，合并前建议人类复核原页。事后自述。

**这条来源支撑的 claim（3 条）：**

- [ ] 「1976 转生物训练，随后 Yale 博后。」　*（文卡特拉曼·拉马克里希南 / ramakrishnan_1976_biology_training）*
- [ ] 「1978 年 Yale 博后与无需第二博士的选择。」　*（文卡特拉曼·拉马克里希南 / ramakrishnan_1978_yale_postdoc）*
- [ ] 「1999 迁移与约 40% 薪酬下降的自述。」　*（文卡特拉曼·拉马克里希南 / ramakrishnan_1999_lmb）*

```
# 结论（改成下面之一，并写清理由）
#   - [x] 已核 —— 原文确实支持
#   - [!] 有出入 —— 出入在哪：
#   - [~] 打不开 —— 情况：
```

---

### 19. `VR-BIO`　About Venki Ramakrishnan

- **机构**：Nobel Prize Inspiration Initiative
- **链接**：<https://www.nobelprize.org/events/nobel-prize-inspiration-initiative/germany-2021-2/about-venki-ramakrishnan/>
- **文献定位**：1976 PhD；UCSD two years；1999 LMB；2000 ribosome structure
- **已知局限**：机构或传记叙述，不能单独证明因果；未保存网页全文。

**这条来源支撑的 claim（3 条）：**

- [ ] 「1976 物理博士、两年生物训练及后续研究。」　*（文卡特拉曼·拉马克里希南 / ramakrishnan_1976_biology_training）*
- [ ] 「后续 LMB 及 2000 年研究进展。」　*（文卡特拉曼·拉马克里希南 / ramakrishnan_1978_yale_postdoc）*
- [ ] 「2000 结构工作及 2009 奖项。」　*（文卡特拉曼·拉马克里希南 / ramakrishnan_1999_lmb）*

```
# 结论（改成下面之一，并写清理由）
#   - [x] 已核 —— 原文确实支持
#   - [!] 有出入 —— 出入在哪：
#   - [~] 打不开 —— 情况：
```

---

### 20. `KK-ROCK`　Katalin Karikó

- **机构**：Rockefeller University / Evelyn Strauss
- **链接**：<https://www.rockefeller.edu/greengard-prize/recipients/katalin-kariko/>
- **文献定位**：1995 降职；1997 Weissman；2005、2008、2009 研究与职位
- **已知局限**：机构或传记叙述，不能单独证明因果；未保存网页全文。

**这条来源支撑的 claim（2 条）：**

- [ ] 「1995 降职、1997 合作；传记转述本人关于 2009 年恢复职位请求被拒的回忆。」　*（卡塔琳·考里科 / kariko_1995_persist_cost）*
- [ ] 「入职前研究与合作背景。」　*（卡塔琳·考里科 / kariko_2013_biontech）*

```
# 结论（改成下面之一，并写清理由）
#   - [x] 已核 —— 原文确实支持
#   - [!] 有出入 —— 出入在哪：
#   - [~] 打不开 —— 情况：
```

---

### 21. `KK-BION`　Katalin Karikó and Drew Weissman awarded Nobel Prize

- **机构**：BioNTech
- **链接**：<https://www.biontech.com/int/en/home/mediaroom/news/statements/2023/10/statement-katalin-kariko-and-drew-weissman-awarded-nobel-prize.html>
- **文献定位**：2013 入职；2014 联合论文；2022 转外部顾问
- **已知局限**：雇主新闻稿，有宣传目的；不据此断言个人收入、幸福或职业最优解。

**这条来源支撑的 claim（1 条）：**

- [ ] 「2013 入职、2014 论文、2022 外部顾问。」　*（卡塔琳·考里科 / kariko_2013_biontech）*

```
# 结论（改成下面之一，并写清理由）
#   - [x] 已核 —— 原文确实支持
#   - [!] 有出入 —— 出入在哪：
#   - [~] 打不开 —— 情况：
```

---

### 22. `FA-AUTO`　Frances H. Arnold — Biographical

- **机构**：Nobel Prize / Frances Arnold
- **链接**：<https://www.nobelprize.org/prizes/chemistry/2018/arnold/biographical/>
- **文献定位**：1979—1980 SERI；January 1981 Berkeley；January 1987 Caltech faculty
- **已知局限**：原页直接访问受限；已核对索引正文。事后自述，需人类复核。

**这条来源支撑的 claim（2 条）：**

- [ ] 「能源机构工作、1981—1985 博士与 1987 教职。」　*（弗朗西丝·阿诺德 / arnold_1981_phd）*
- [ ] 「博士后经历、1987 教职及获奖时的自述。」　*（弗朗西丝·阿诺德 / arnold_1987_caltech_faculty）*

```
# 结论（改成下面之一，并写清理由）
#   - [x] 已核 —— 原文确实支持
#   - [!] 有出入 —— 出入在哪：
#   - [~] 打不开 —— 情况：
```

---

### 23. `JG-AUTO`　Sir John B. Gurdon — Biographical

- **机构**：Nobel Prize / John Gurdon
- **链接**：<https://www.nobelprize.org/prizes/medicine/2012/gurdon/biographical/>
- **文献定位**：1952 Oxford admission / 1953 Zoology；1960 邀请；Post-Doctoral Work
- **已知局限**：原页直接访问受限；已核对索引正文。1960 是邀约年份，赴美确切年份未据此锁定。

**这条来源支撑的 claim（2 条）：**

- [ ] 「古典学科、家庭聘请辅导、1953 动物学及 1960 邀约。」　*（约翰·格登 / gurdon_1953_zoology）*
- [ ] 「1960 邀约及一年后结束该方向。」　*（约翰·格登 / gurdon_1960_caltech_offer）*

```
# 结论（改成下面之一，并写清理由）
#   - [x] 已核 —— 原文确实支持
#   - [!] 有出入 —— 出入在哪：
#   - [~] 打不开 —— 情况：
```

---

### 24. `JG-INTERVIEW`　Sir John Gurdon: Godfather of cloning

- **机构**：Journal of Cell Biology / PMC
- **链接**：<https://pmc.ncbi.nlm.nih.gov/articles/PMC2315664/>
- **文献定位**：Caltech bacteriophage postdoc 与一年后回到胚胎研究
- **已知局限**：2008 年回顾访谈；不能将不擅长某一实验等同于整体科研能力不足。

**这条来源支撑的 claim（1 条）：**

- [ ] 「不适配和回到胚胎研究的本人解释。」　*（约翰·格登 / gurdon_1960_caltech_offer）*

```
# 结论（改成下面之一，并写清理由）
#   - [x] 已核 —— 原文确实支持
#   - [!] 有出入 —— 出入在哪：
#   - [~] 打不开 —— 情况：
```

---

### 25. `JD-BIO`　James Dyson

- **机构**：Dyson
- **链接**：<https://www.dyson.com/james-dyson>
- **⚠️ 自动工具打不开**：该域名有反爬，必须用普通浏览器点一次
- **文献定位**：2014 electric vehicle；2019 halted
- **已知局限**：企业创始人介绍，有宣传选择偏差。

**这条来源支撑的 claim（1 条）：**

- [ ] 「2014 年启动电动车计划。」　*（詹姆斯·戴森 / dyson_2014_ev_entry）*

```
# 结论（改成下面之一，并写清理由）
#   - [x] 已核 —— 原文确实支持
#   - [!] 有出入 —— 出入在哪：
#   - [~] 打不开 —— 情况：
```

---

### 26. `JD-CLOSE`　An update on the Dyson automotive project

- **机构**：James Dyson / Dyson
- **链接**：<https://www.dyson.com/automotive>
- **⚠️ 自动工具打不开**：该域名有反爬，必须用普通浏览器点一次
- **文献定位**：2019-10-10 员工信：商业不可行、买方寻找失败、关闭项目
- **已知局限**：管理层当时声明；员工安置是承诺，不当作已实现的结果。

**这条来源支撑的 claim（2 条）：**

- [ ] 「2019 员工信说明商业不可行、寻找买方失败及停止项目。」　*（詹姆斯·戴森 / dyson_2019_abandon_ev）*
- [ ] 「2019 商业不可行及终止项目。」　*（詹姆斯·戴森 / dyson_2014_ev_entry）*

```
# 结论（改成下面之一，并写清理由）
#   - [x] 已核 —— 原文确实支持
#   - [!] 有出入 —— 出入在哪：
#   - [~] 打不开 —— 情况：
```

---

### 27. `SB-INVESTOR`　Slack

- **机构**：Andreessen Horowitz / John O’Farrell
- **链接**：<https://a16z.com/announcement/slack/>
- **文献定位**：October 2012 Glitch failure；40 to 8；$4m；Slack development
- **已知局限**：投资人回顾，有利益关系；产品上市不证明所有员工或投资人均获益。

**这条来源支撑的 claim（2 条）：**

- [ ] 「2012 项目失败、团队缩减及后续 Slack。」　*（斯图尔特·巴特菲尔德 / butterfield_2012_close_glitch）*
- [ ] 「剩余团队和资金、客户与上市回顾。」　*（斯图尔特·巴特菲尔德 / butterfield_2013_slack_pivot）*

```
# 结论（改成下面之一，并写清理由）
#   - [x] 已核 —— 原文确实支持
#   - [!] 有出入 —— 出入在哪：
#   - [~] 打不开 —— 情况：
```

---

### 28. `SB-ORIGIN`　What is Slack and how does it work?

- **机构**：Slack
- **链接**：<https://slack.com/resources/why-use-slack/what-is-slack-and-how-does-it-work>
- **文献定位**：internal chat tool for Glitch
- **已知局限**：公司回顾仅支持内部工具起源；该页把游戏关闭写为 2013，与当时记录和投资人所述 2012 冲突，不用于关闭年份。

**这条来源支撑的 claim（1 条）：**

- [ ] 「Slack 起源于游戏团队内部沟通工具。」　*（斯图尔特·巴特菲尔德 / butterfield_2013_slack_pivot）*

```
# 结论（改成下面之一，并写清理由）
#   - [x] 已核 —— 原文确实支持
#   - [!] 有出入 —— 出入在哪：
#   - [~] 打不开 —— 情况：
```

---

### 29. `SB-LAUNCH`　Slack, The Newest Enterprise Social Network, Is The Latest Effort From Flickr Co-Founder Stewart Butterfield

- **机构**：TechCrunch
- **链接**：<https://techcrunch.com/2013/08/14/say-hello-to-slack-the-newest-enterprise-social-network-and-the-latest-effort-from-flickr-co-founder-stewart-butterfields-tiny-speck/>
- **文献定位**：2013-08-14 发布报道
- **已知局限**：仅用于发布年份，产品当时仍在有限测试阶段。

**这条来源支撑的 claim（1 条）：**

- [ ] 「2013 年发布测试产品。」　*（斯图尔特·巴特菲尔德 / butterfield_2013_slack_pivot）*

```
# 结论（改成下面之一，并写清理由）
#   - [x] 已核 —— 原文确实支持
#   - [!] 有出入 —— 出入在哪：
#   - [~] 打不开 —— 情况：
```

---

### 30. `EY-BIO`　Eric S. Yuan

- **机构**：Zoom Investor Relations
- **链接**：<https://investors.zoom.us/board-member-management/eric-yuan>
- **⚠️ 自动工具打不开**：该域名有反爬，必须用普通浏览器点一次
- **文献定位**：1997 WebEx、2007 Cisco、June 2011 Zoom
- **已知局限**：机构或传记叙述，不能单独证明因果；未保存网页全文。**该域名（investors.zoom.us）有 Akamai 反爬，自动化工具与无头浏览器均被拒（返回 403 或超时），无法用工具确认深链是否仍存在。**人工核查路径：浏览器打开 investors.zoom.us → Governance → Board of Directors；交叉核对：https://en.wikipedia.org/wiki/Eric_Yuan （二手来源，仅用于交叉验证履历年份）。

**这条来源支撑的 claim（1 条）：**

- [ ] 「WebEx/Cisco 履历和 2011 年创办 Zoom。」　*（袁征 / yuan_2011_zoom）*

```
# 结论（改成下面之一，并写清理由）
#   - [x] 已核 —— 原文确实支持
#   - [!] 有出入 —— 出入在哪：
#   - [~] 打不开 —— 情况：
```

---

### 31. `EY-2023`　A Message from Eric Yuan, CEO of Zoom

- **机构**：Eric Yuan / Zoom
- **链接**：<https://www.zoom.com/en/blog/a-message-from-eric-yuan-ceo-of-zoom/>
- **文献定位**：2023-02-07 裁员约 1300 人、15%；承担责任
- **已知局限**：CEO 对员工的声明，不是独立调查，不能归咎于单次创办决定。

**这条来源支撑的 claim（1 条）：**

- [ ] 「2023 裁员及 CEO 对过快扩张的反思。」　*（袁征 / yuan_2011_zoom）*

```
# 结论（改成下面之一，并写清理由）
#   - [x] 已核 —— 原文确实支持
#   - [!] 有出入 —— 出入在哪：
#   - [~] 打不开 —— 情况：
```

---

### 32. `SA-INTERVIEW`　How Sara Blakely Started Spanx

- **机构**：Sara Blakely / Inc.
- **链接**：<https://www.inc.com/sara-blakely/how-sara-blakley-started-spanx.html>
- **⚠️ 自动工具打不开**：该域名有反爬，必须用普通浏览器点一次
- **文献定位**：2012 视频文字：传真机销售、积蓄、夜间周末、一年打样
- **已知局限**：创始人回忆，未确认准确离职日期。

**这条来源支撑的 claim（1 条）：**

- [ ] 「此前销售工作、夜间周末开发与制造商寻找。」　*（萨拉·布莱克利 / blakely_2000_spanx）*

```
# 结论（改成下面之一，并写清理由）
#   - [x] 已核 —— 原文确实支持
#   - [!] 有出入 —— 出入在哪：
#   - [~] 打不开 —— 情况：
```

---

### 33. `SA-INVESTOR`　Behind the Deal: Blackstone’s Investment in SPANX

- **机构**：Blackstone
- **链接**：<https://www.blackstone.com/insights/article/blackstones-investment-in-spanx/>
- **⚠️ 自动工具打不开**：该域名有反爬，必须用普通浏览器点一次
- **文献定位**：2000 创办；2021 多数股权投资
- **已知局限**：投资人公告；不使用估值推算本人到手财富。

**这条来源支撑的 claim（1 条）：**

- [ ] 「2000 创办、初始资金及 2021 投资。」　*（萨拉·布莱克利 / blakely_2000_spanx）*

```
# 结论（改成下面之一，并写清理由）
#   - [x] 已核 —— 原文确实支持
#   - [!] 有出入 —— 出入在哪：
#   - [~] 打不开 —— 情况：
```

---

### 34. `FK-CHRON`　Chronik

- **机构**：S. Fischer Verlag / FranzKafka.de
- **链接**：<https://www.franzkafka.de/leben/chronik>
- **文献定位**：1908、1912、1922、1923、1924 年条目
- **已知局限**：出版社年表；不据年表推断疾病与迁居的因果关系。

**这条来源支撑的 claim（2 条）：**

- [ ] 「1908 入新岗位、发表；1912 创作；1922 退休。」　*（弗兰茨·卡夫卡 / kafka_1908_insurance_and_writing）*
- [ ] 「1922 退休、1923 柏林、通胀与健康、1924 返乡及去世。」　*（弗兰茨·卡夫卡 / kafka_1923_berlin）*

```
# 结论（改成下面之一，并写清理由）
#   - [x] 已核 —— 原文确实支持
#   - [!] 有出入 —— 出入在哪：
#   - [~] 打不开 —— 情况：
```

---

### 35. `CN-AUTO`　Christiane Nüsslein-Volhard — Biographical

- **机构**：Nobel Prize / Christiane Nüsslein-Volhard
- **链接**：<https://www.nobelprize.org/prizes/medicine/1995/nusslein-volhard/biographical/>
- **文献定位**：1962 医院试做；summer 1964 Tübingen；Diplom 1969；PhD 1973
- **已知局限**：原页直接访问受限；已核对索引正文。课程不合预期属于本人评价。

**这条来源支撑的 claim（2 条）：**

- [ ] 「1962 医院体验、1964 生化、1969 文凭、1973 博士。」　*（克里斯蒂安妮·纽斯莱因-福尔哈德 / nusslein_1962_test_medicine）*
- [ ] 「1964 转入、生化课程评价、1969 文凭与 1973 博士。」　*（克里斯蒂安妮·纽斯莱因-福尔哈德 / nusslein_1964_biochemistry）*

```
# 结论（改成下面之一，并写清理由）
#   - [x] 已核 —— 原文确实支持
#   - [!] 有出入 —— 出入在哪：
#   - [~] 打不开 —— 情况：
```

---

### 36. `AE-UZH`　Albert Einstein

- **机构**：University of Zurich
- **链接**：<https://www.uzh.ch/en/researchinnovation/excellence/nobelprize/einstein>
- **文献定位**：1900 无大学助教职位；1902—1909 专利局；1905 博士；1909 教职
- **已知局限**：机构或传记叙述，不能单独证明因果；未保存网页全文。

**这条来源支撑的 claim（2 条）：**

- [ ] 「1900 求职、1902—1909 专利局、1905 学位与论文、1909 教职。」　*（阿尔伯特·爱因斯坦 / einstein_1902_patent_and_research）*
- [ ] 「既有工作与学位、1909 年首个教职。」　*（阿尔伯特·爱因斯坦 / einstein_1909_academic_post）*

```
# 结论（改成下面之一，并写清理由）
#   - [x] 已核 —— 原文确实支持
#   - [!] 有出入 —— 出入在哪：
#   - [~] 打不开 —— 情况：
```

---

## 核完之后

把这份文件里的打勾情况汇总到 `data/REVIEW.md`，并更新那句
「人类审核尚未完成」。二者的关系：

- `data/REVIEW.md` —— 审查**结论**与整体判断（给人看的状态）
- `data/REVIEW-CHECKLIST.md` —— 逐条的**工作底稿**（给人用的表格）
