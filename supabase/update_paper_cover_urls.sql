-- Replace paper cover images with local, consistent design assets
update public.papers
set image_url = '/assets/papers/aigc-cover.svg',
    updated_at = timezone('utc', now())
where title = '焦虑的采纳者：AIGC技术接受中自我控制与比较焦虑的竞争性作用';

update public.papers
set image_url = '/assets/papers/labor-cover.svg',
    updated_at = timezone('utc', now())
where title = '教育水平对工作时间的影响研究及其性别差异的异质性分析';

update public.papers
set image_url = '/assets/papers/regional-cover.svg',
    updated_at = timezone('utc', now())
where title = '产业集聚、创新活动与区域经济增长：基于中国城市的实证研究';

