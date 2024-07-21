<template>
    <div class="about-container">
        <h1>关于</h1>
        <MarkdownRenderer :content="markdownContent" />
        <div class="image-comparison">
            <h3>项目改进</h3>
            <p>原项目仅支持通过标题生成思维导图，并可进行编辑。</p>
            <p>优化后的项目不仅可以通过标题生成思维导图，还可以添加参考资料进行编辑。也可以生成流程图、用例图和时序图</p>
            <div class="image-group">
                <div class="image-container">
                    <h5>原项目</h5>
                    <img src="@/assets/css/original-1.png" alt="原项目图片1" />
                </div>
                <div class="image-container">
                    <h5>现项目</h5>
                    <img src="@/assets/css/improved-1.png" alt="优化后项目图片1" />
                </div>
            </div>
            <p>并且我们还对移动端界面进行了UI适配，非常的nice</p>
            <div class="image-group">
                <div class="image-container">
                    <h5>原项目</h5>
                    <img src="@/assets/css/original-2.png" alt="原项目图片2" />
                </div>
                <div class="image-container">
                    <h5>现项目</h5>
                    <img src="@/assets/css/improved-2.png" alt="优化后项目图片2" />
                </div>
            </div>
        </div>
        <h4>原项目收款码让我删了，免费的东西不收钱,要支持上主页点个赞好了</h4>
    </div>
</template>

<script>
import MarkdownRenderer from '@/components/MarkdownRenderer.vue';

export default {
    name: 'About',
    components: {
        MarkdownRenderer,
    },
    data() {
        return {
            markdownContent: `
# 开发的目的

_开源是为了_ 让所有朋友用上免费的 GPT AI 思维导图。

# 作者

**原作者**
PastKing

**现作者**
MistPeak

# 原项目地址(GitHub)

[MarkMap-OpenAi-ChatGpt](https://github.com/PastKing/MarkMap-OpenAi-ChatGpt)

# 现项目地址(GitHub)

[MarkMap-OpenAi-ChatGpt](https://github.com/zhanghxiao/MarkMap-OpenAi-ChatGpt)
`
        };
    }
};
</script>

<style scoped>
.about-container {
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
    font-family: Arial, sans-serif;
}

h1 {
    text-align: center;
    color: #2c3e50;
    margin-bottom: 20px;
}

.image-comparison {
    text-align: center;
    margin-top: 20px;
}

.image-group {
    display: flex;
    justify-content: space-around;
    margin: 20px 0;
}

.image-container {
    width: 48%;
    text-align: center;
}

.image-container h5 {
    margin-bottom: 10px;
    color: #2c3e50;
}

.image-container img {
    width: 100%;
    max-width: 100%; /* Ensure the image scales correctly */
    border: 1px solid #ccc;
    border-radius: 10px;
}

h4 {
    text-align: center;
    margin-top: 20px;
    color: #2c3e50;
}

.donation-qr-code {
    display: block;
    margin: 20px auto;
    width: 200px;
    border: 1px solid #ccc;
    border-radius: 10px;
}
</style>
