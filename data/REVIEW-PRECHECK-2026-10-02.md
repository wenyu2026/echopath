# 来源预核对报告（AI 逐条，2026-10-02）

> **这份报告是什么**：对 `data/sources.json` 全部 36 条含非 AI claim 的来源，逐条抓取网页原文、
> 与 claim 比对后的预核对结果。目的是把人类复核员的工作从「逐条查」压缩成「确认签字」。
>
> **这份报告不是什么**：它**不构成人类签字**。`data/review.json` 的 `human_review` 保持 `pending`，
> 人工复核请走 [`REVIEW-CHECKLIST.md`](REVIEW-CHECKLIST.md)，完成后按协议记录 `reviewed_by` / `reviewed_on`。
> 数据集自己的话仍然成立：**结构校验通过不等于史实获人类确认。**

## 方法与诚实性声明

- 工具：直接抓取原页（WebFetch / 网页读取工具），逐条比对 claim 与页面原文并记录引文。
- **4 条原站反爬/超时的来源经 Wayback Machine 快照核对全文**（下表标 ⛳）：引文取自存档副本，
  不是原站当前页面 —— 其中 VR-AUTO 的 limitations 本身就要求「合并前人类复核原页」，请留意。
- 2 条裁决带「推断成分」（下表标 🔶）：页面无直接数字，年份由上下文推算，逻辑可靠但建议人眼过一遍。
- 结论统计：**63 条非 AI claim —— 59 条 ✅ 有原文直接支撑；2 条 ⚠️ 年份需人工合并确认（BM-LJMU）；2 条 ⚠️ 链接层级过浅未能直读原文（LX-MUSEUM）。0 条死链，0 条与原文矛盾。**

## 逐条结果

### 鲁迅（3 条来源）

| # | 来源 | 裁决 | 关键引文 / 说明 |
|---|---|---|---|
| 1 | LX-TOHOKU 东北大学史料馆 | ✅ | 「1902年…作为浙江省官费留学生东渡日本，进入东京弘文学院」「1904年9月进入…仙台医学专门学校」「1906年春从仙台医专退学」（2 条 claim 全支撑；注：页面退学通知图注误写 1909，正文 1906 正确） |
| 2 | LX-SENDAI 东北大学英文新闻 | ✅ | "as a student at Sendai Medical College … from 1904 to 1906." |
| 3 | LX-PREFACE 维基文库《呐喊》 | ✅ | 自序全文在页，落款「一九二二年十二月三日」；弃医从文、《新生》筹刊失败、金心异铁屋子对话均有原文 |
| 4 | LX-SELECT 维基文库《自选集》自序 | ✅ | 「我做小说，是开手于一九一八年」；落款「一九三二年十二月十四日」 |
| 5 | LX-MUSEUM 上海鲁迅纪念馆 | ⚠️ | URL 是**首页**，首页看不到「1918—1922 十四篇小说」陈列内容（栏目需要进子页）。旁证：《呐喊》维基文库页目录恰为 14 篇（1918《狂人日记》—1922《社戏》）。**建议：把 sources.json 的 URL 换成陈列子页，或人工进站确认** |

### 李安 / 村上春树（4 条）

| # | 来源 | 裁决 | 关键引文 / 说明 |
|---|---|---|---|
| 6 | AL-INTERVIEW 澎湃《李安访谈录》 | ✅ | 「从电影学院毕业后，我经历了六年的制作地狱」「1990年，我参加了台湾地区举办的剧本比赛…同时获得了一等奖和二等奖」（注意：原话是「制作地狱/屡战屡败」，不是「在家赋闲」，claim 写「筹片」与原文相符） |
| 7 | AL-NYU 纽约大学 Tisch | ✅ | "Ang Lee ’84/Hon. ’01 (MFA, Kanbar Institute, Graduate Film)" + 奥斯卡/金狮履历 |
| 8 | HM-SELF LitHub 自述 | ✅ | "One bright April afternoon in 1978, I attended a baseball game at Jingu Stadium"；厨房夜间写作；1979《且听风吟》新人奖；"shortly after completing Pinball, 1973 … we sold the business"（卖店发生在前两部小说之后 —— 与 1981 年卖店的另一来源互补不矛盾） |
| 9 | HM-1981 博洛尼亚图书馆 | ✅ | "Nel 1981 Murakami vende il jazz bar e comincia a vivere dei proventi ricavati dalla vendita dei suoi libri" |

### 达尔文（3 条）

| # | 来源 | 裁决 | 关键引文 / 说明 |
|---|---|---|---|
| 10 | CD-STUDY 剑桥达尔文通信项目 | ✅ | "In October 1825 … went to study medicine in Edinburgh"；"did not enjoy anatomy and dissection"；"summer of 1827 … decided not to continue the study of medicine"；"in January 1828 he went up to Cambridge" |
| 11 | CD-CHURCH 同上 | ✅ | "went up to Cambridge in 1828 with the aim of completing the necessary studies to be a clergyman"；航行出发时仍"intent on returning to his religious studies"（与 1831 条目的「原有教会路径」互补） |
| 12 | CD-BEAGLE 同上 | ✅ | "offer of a place on board … HMS Beagle"；说服父亲同意并资助；"sailed from Plymouth on 27 December 1831 … 2 October 1836" |

### 乔布斯 / 贝索斯 / 布赖恩·梅（⛳ 4 条）

| # | 来源 | 裁决 | 关键引文 / 说明 |
|---|---|---|---|
| 13 | SJ-REED Reed College | ✅ | "was a student at Reed College in the fall of 1972"；"After just one semester, he dropped out but continued … auditing classes, including … calligraphy." |
| 14 | SJ-SPEECH Stanford 演讲 ⛳ | ✅ | 原站 403，经 Wayback 快照核对全文。"I slept on the floor in friends' rooms""returned Coke bottles""I had just turned 30.""So at 30 I was out."；NeXT/Pixar 五年、Apple 回归。**留意：原词是 fired（被解雇），claim 写「离开」属自述语境，不算出入但人眼确认一下措辞** |
| 15 | JB-SPEECH Princeton 2010 ⛳ | ✅ | 原站超时，经 Wayback 快照核对。"I got the idea to start Amazon 16 years ago."；老板建议 "think about it for 48 hours"；MacKenzie 支持 |
| 16 | BM-LJMU 利物浦约翰摩尔斯大学 | ⚠️ | 1974 中断、2006 重新注册均有原文（"suspending his studies in 1974" / "re-registered for his PhD in 2006"）；**但「2007 完成」该页未明写** —— 页面把 2007 明写为出任 LJMU 校长。需与 #17 的 "August 2007" 合并确认 |
| 17 | BM-IMPERIAL 帝国理工 2007 讲座 | ✅ | "to hand in his completed thesis to Professor Kirpal Nandra … in August 2007."（1974 旧打印稿、回顾三十年工作均有原文）。此页直接补足 #16 的 2007 年份 —— **两条 ⚠️ 实为同一处，合并确认即可** |

### 拉马克里希南 / 考里科 / 弗朗西丝·阿诺德 / 格登（⛳ 6 条）

| # | 来源 | 裁决 | 关键引文 / 说明 |
|---|---|---|---|
| 18 | VR-AUTO Nobel 自传 ⛳ | ✅ | 原站超时，经 Wayback 快照核对。"obtained a Ph.D. in physics in 1976""I had already decided I was going to switch to biology""take a 40% salary cut and move to the LMB""I moved to Cambridge in April of 1999" |
| 19 | VR-BIO NPII | ✅ | "PhD in physics from Ohio University in 1976""studied biology for two years at UCSD""Since 1999 … group leader at the MRC Laboratory of Molecular Biology""In 2000 … atomic structure of the 30S ribosomal subunit"（页面 `<title>` 是通用名，本体正确 —— 人眼留意题名映射） |
| 20 | KK-ROCK 洛克菲勒大学 🔶 | ✅ | "In 1995, her position was revoked""She could stay if she would accept a demotion""In 1997, she met Drew Weissman"；恢复职位被拒："was told that she was 'not faculty quality'"。🔶 **页面无 "2009" 数字**，由 "reported these findings in 2008" + "The following year" 推算，建议人眼过一遍 |
| 21 | KK-BION BioNTech | ✅ | "joined the BioNTech family in 2013"；2014 合著论文（Sahin/Karikó/Türeci）；"In 2022 … external consultant"（注意 2014 论文不是 2005 与 Weissman 的那篇，claim 未混同） |
| 22 | FA-AUTO Nobel 自传 | ✅ | "1979–1980" SERI；"beginning in January 1981"（Berkeley 博士项目）；"started as Assistant Professor … in January 1987"。🔶 **"1985 获博士"页面未明写**，作为时间段（1981–1985）成立 |
| 23 | JG-AUTO Nobel 自传 | ✅ | 私人辅导 "generously funded by his parents"；"started the course in Zoology at Oxford in 1953"；1960 Beadle 访问带来的 Caltech 邀约 |
| 24 | JG-INTERVIEW J Cell Biol ⛳ | ✅ | PMC 403，经 Wayback 快照核对（WebSearch 确认来源仍在索引）。"I could never make these phage work properly""After a year of trying, I gave up and went back to working with embryos" |

### 戴森 / Slack（5 条）

| # | 来源 | 裁决 | 关键引文 / 说明 |
|---|---|---|---|
| 25 | JD-BIO Dyson 官网 | ✅ | "in 2014, James developed plans for a radical new battery-electric vehicle … the project was halted in 2019"（WebFetch 403，经网页读取工具取得正文） |
| 26 | JD-CLOSE Dyson 员工信 | ✅ | 2019-10-10 员工信全文在页：商业不可行、寻找买方失败、关闭项目（同 403 → 读取工具取得） |
| 27 | SB-INVESTOR a16z | ✅ | "shut down the game and lay off all but eight of 40 employees""He still had about $4M in cash"；署名 John O'Farrell |
| 28 | SB-ORIGIN Slack 官网 | ✅ | "The software began as an internal chat tool for a game called Glitch by the startup Tiny Speck."（该页写关停为 2013 —— 数据侧已按「只用品牌页支持内部工具起源」处理，与 a16z 的 2012-10 决策叙述分账，纪律正确） |
| 29 | SB-LAUNCH TechCrunch | ✅ | 2013-08-14 报道在档："is today launching Slack""trialling its service among … 45 in all"。小注：TechCrunch 写 "Glitch closed down in November 2012" 与 a16z 的 10 月信件差一个月（宣布 vs 完成关停），claim 只用「2012 项目失败」，不受影响 |

### Zoom / Spanx / 卡夫卡 / 纽斯莱因 / 爱因斯坦（6 条）

| # | 来源 | 裁决 | 关键引文 / 说明 |
|---|---|---|---|
| 30 | EY-BIO Zoom IR | ✅ | "served as … since June 2011"；"From May 2007 to June 2011 … Cisco"；"from August 1997 until its acquisition by Cisco … in May 2007"（原站两次超时，读取工具取得） |
| 31 | EY-2023 Zoom 博客 | ✅ | 2023-02-07 发布；"reduce our team by approximately 15% and say goodbye to around 1,300 hardworking, talented colleagues"；"I am accountable for these mistakes" |
| 32 | SA-INTERVIEW Inc. | ✅ | "selling fax machines door-to-door for seven years … $5,000 in savings""took me a year of working on it at night, and on the weekends""I started calling all of these hosiery mills" |
| 33 | SA-INVESTOR Blackstone | ✅ | "started the company in 2000 with $5,000 in savings"；"In 2021, Blackstone announced a majority investment in SPANX" |
| 34 | FK-CHRON franzkafka.de | ✅ | 1908 入职工伤保险机构 + 首次发表；1912 "Die Verwandlung entsteht"；1922 "»Vorübergehende« Pensionierung"（注意原文「暂时的」退休带引号）；1923 柏林-Steglitz；1924 返乡与去世 |
| 35 | CN-AUTO Nobel 自传 | ✅ | "I did a one month course as a nurse in a hospital. This experience greatly supported my conviction **not** to become a doctor."（1962）；"(Summer 1964) … went there to study biochemistry"；1969 Diplom；1973 博士论文完成 |
| 36 | AE-UZH 苏黎世大学 | ✅ | "was not offered an assistant's position"；"worked from 1902 to 1909 as an employee of the Federal Patent Office"；1905 向苏黎世大学提交博士论文；"In 1909 … his first academic position" |

## 人工签字前建议只看这 5 处（其余可直接翻本报告确认）

1. **LX-MUSEUM（#5）**：进 luxunmuseum.cn「基本陈列」子页找到 1918—1922 十四篇小说的陈列，或把 sources.json 的 URL 换成子页直链
2. **BM-LJMU + BM-IMPERIAL（#16/#17）**：两页合并确认「1974 中断 → 2006 恢复 → 2007.8 提交论文」的链路（2007 年份只在帝国理工页）
3. **KK-ROCK（#20）**：亲眼看 "The following year" 那一段，确认 2009 的推算口径
4. **⛳ 4 条 Wayback 来源（#14/#15/#18/#24）**：浏览器直开原站，确认存档与当前页面一致
5. **SJ-SPEECH（#14）措辞**：原词 fired，claim 用「离开」—— 确认是否维持自述语境的措辞

## 结论

- **63 条非 AI claim：59 ✅ / 4 ⚠️（归并为上表 3 处人工确认点）/ 0 ❌，无一处「原文与 claim 矛盾」**
- 现有数据的口径纪律（未知不编造、机构叙述不作因果、AI 推断单独标注）在这次逐条比对中**没有发现违例**
- `human_review` 维持 `pending`，等人类按上述 5 处确认后签字
