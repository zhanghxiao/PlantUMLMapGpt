<template>
    <el-row :gutter="20" class="mind-container">
        <el-col :span="8" class="left-panel">
            <el-row :gutter="20">
                <el-col :span="24">
                    <el-input v-model="title" placeholder="输入标题"></el-input>
                </el-col>
            </el-row>
            <el-row :gutter="20" style="margin-top: 10px;">
                <el-col :span="24">
                    <el-button type="primary" @click="generateMindMap">生成</el-button>
                </el-col>
            </el-row>
            <el-row :gutter="20" style="margin-top: 10px;">
                <el-col :span="24">
                    <el-radio-group v-model="selectedMethod">
                        <el-radio-button label="方法一"></el-radio-button>
                        <el-radio-button label="方法二"></el-radio-button>
                    </el-radio-group>
                </el-col>
            </el-row>
            <el-row v-if="selectedMethod === '方法一'" :gutter="20" style="margin-top: 10px;">
                <el-col :span="24">
                    <el-input v-model="referenceContent" type="textarea" rows="5" placeholder="输入参考内容"></el-input>
                </el-col>
            </el-row>
            <el-row v-if="selectedMethod === '方法二'" :gutter="20" style="margin-top: 10px;">
                <el-col :span="24">
                    <el-input v-model="referenceContent" type="textarea" rows="5" placeholder="输入参考内容"></el-input>
                </el-col>
            </el-row>
            <el-row :gutter="20" style="margin-top: 20px;">
                <el-col :span="24">
                    <el-input v-model="editorContent" type="textarea" rows="10" placeholder="编辑内容"></el-input>
                </el-col>
            </el-row>
            <!-- 控制按钮区域，默认隐藏 -->
            <el-row :gutter="10" class="controls controls-mobile">
                <el-col :span="6">
                    <el-button @click="zoomIn">放大</el-button>
                </el-col>
                <el-col :span="6">
                    <el-button @click="zoomOut">缩小</el-button>
                </el-col>
                <el-col :span="6">
                    <el-button @click="fitToScreen">适应屏幕</el-button>
                </el-col>
                <el-col :span="6">
                    <el-button @click="onSave">下载</el-button>
                </el-col>
            </el-row>
        </el-col>

        <el-col :span="16" class="right-panel">
            <div class="svg-container">
                <img v-if="selectedMethod === '方法二'" :src="diagramUrl" ref="imageRef" class="scalable" alt="生成图像" />
                <svg v-else ref="svgRef" class="markmap-svg"></svg>
            </div>
            <!-- 控制按钮区域，默认显示 -->
            <el-row :gutter="10" class="controls controls-pc">
                <el-col :span="6">
                    <el-button @click="zoomIn">放大</el-button>
                </el-col>
                <el-col :span="6">
                    <el-button @click="zoomOut">缩小</el-button>
                </el-col>
                <el-col :span="6">
                    <el-button @click="fitToScreen">适应屏幕</el-button>
                </el-col>
                <el-col :span="6">
                    <el-button @click="onSave">下载</el-button>
                </el-col>
            </el-row>
        </el-col>
    </el-row>
</template>

<script>
import { ref, onMounted, onUpdated, watch } from 'vue'
import { Transformer } from 'markmap-lib'
import { Markmap } from 'markmap-view'
import * as htmlToImage from 'html-to-image'
import { saveAs } from 'file-saver'

export default {
    name: 'HomeView',
    setup() {
        const transformer = new Transformer()

        const title = ref('')
        const referenceContent = ref('')
        const editorContent = ref('')
        const selectedMethod = ref('方法一')
        const contentModified = ref(false)
        const diagramUrl = ref(require('@/assets/two.png')) // Initial placeholder image

        const mm = ref(null)
        const svgRef = ref(null)
        const imageRef = ref(null) // Reference to the image element
        const scale = ref(1) // Scale state for image zoom
        const isDragging = ref(false) // State for drag
        const startX = ref(0) // Initial X position for drag
        const startY = ref(0) // Initial Y position for drag
        const translateX = ref(0) // Translation X for drag
        const translateY = ref(0) // Translation Y for drag

        const methodOneTemplate = `
# 思维导图

## 标题1
- 子标题1
    - 三级标题1
    - 三级标题2
- 子标题2
    - 三级标题1
    - 三级标题2
    - 三级标题3
- 子标题3
- 子标题4

## 标题2
- 子标题1
- 子标题2
- 子标题3


## 标题3
- 子标题1
- 子标题2


        `

        const methodTwoTemplate = `
@startmindmap
* 思维导图
** 主题1
*** 子主题1
**** 叶子节点1
*** 子主题2
**** 叶子节点2
** 主题2
*** 子主题3
**** 叶子节点3
** 主题3
*** 子主题4
**** 叶子节点4
**** 叶子节点5
@endmindmap
        `

        const update = () => {
            if (!mm.value || !svgRef.value) return
            const { root } = transformer.transform(editorContent.value)
            mm.value.setData(root)
            mm.value.fit()
        }

        const zoomIn = () => {
            if (selectedMethod.value === '方法一') {
                mm.value && mm.value.rescale(1.25)
            } else {
                scale.value *= 1.25
                updateImageTransform()
            }
        }

        const zoomOut = () => {
            if (selectedMethod.value === '方法一') {
                mm.value && mm.value.rescale(0.8)
            } else {
                scale.value *= 0.8
                updateImageTransform()
            }
        }

        const fitToScreen = () => {
            if (selectedMethod.value === '方法一') {
                mm.value && mm.value.fit()
            } else {
                scale.value = 1
                translateX.value = 0
                translateY.value = 0
                updateImageTransform()
            }
        }

        const onSave = async () => {
            if (selectedMethod.value === '方法一') {
                const dataUrl = await htmlToImage.toPng(svgRef.value)
                saveAs(dataUrl, 'pastking.png')
            } else {
                // Download the generated image for method two
                const imageResponse = await fetch(diagramUrl.value)
                const imageBlob = await imageResponse.blob()
                saveAs(imageBlob, 'mindmap.png')
            }
        }

        const generateMindMap = async () => {
            if (selectedMethod.value === '方法一') {
                try {
                    const response = await fetch(
                        `${process.env.VUE_APP_API_BASE_URL}/v1/chat/completions`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${process.env.VUE_APP_API_KEY}`
                            },
                            body: JSON.stringify({
                                messages: [
                                    {
                                        role: 'system',
                                        content: `我将设计思维导图，请以markdown格式输出`
                                    },
                                    {
                                        role: 'user',
                                        content: `${title.value}${referenceContent.value ? '\n参考内容：' + referenceContent.value : ''}`
                                    }
                                ],
                                stream: true,
                                model: `claude-3-5-haiku-20241022`,
                                temperature: 0.5,
                                presence_penalty: 2
                            })
                        }
                    )

                    const reader = response.body.getReader()
                    const decoder = new TextDecoder('utf-8')
                    let result = ''

                    while (true) {
                        const { done, value } = await reader.read()
                        if (done) break
                        const chunk = decoder.decode(value, { stream: true })
                        const lines = chunk.split('\n').filter(line => line.trim())
                        for (const line of lines) {
                            if (line === 'data: [DONE]') return
                            if (line.startsWith('data: ')) {
                                const data = JSON.parse(line.slice(6))
                                if (data.choices[0].delta && data.choices[0].delta.content) {
                                    result += data.choices[0].delta.content
                                    editorContent.value = result // Update the editor content
                                }
                            }
                        }
                    }

                    editorContent.value = result.trim()
                    contentModified.value = true // Mark content as modified
                    update() // Ensure the mind map updates immediately
                } catch (error) {
                    console.error('Error generating mind map:', error)
                }
            } else {
                // 方法二：使用 OpenAI 生成新的 markdown 内容
                try {
                    const response = await fetch(
                        `${process.env.VUE_APP_API_BASE_URL}/v1/chat/completions`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${process.env.VUE_APP_API_KEY}`
                            },
                            body: JSON.stringify({
                                messages: [
                                    {
                                        role: 'system',
                                        content: `我想使用代码创建一个《${title.value}》的思维导图，其中包含多个主题和子主题，以及叶子节点。请你提供一些Markdown格式的文本。在Markdown格式中，首行必须是@startmindmap，结尾必须是@endmindmap，* 表示中央主题， ** 表示主要主题，*** 表示子主题，**** 表示叶子节点。请参照以上格式，在markdown代码块中帮我创建一个有效的思维导图。下面是参考内容，如果有请参考，如果显示暂无则请你直接生成不用使用参考内容:${referenceContent.value ? referenceContent.value : '暂无'}`
                                    }
                                ],
                                stream: true,
                                model: `claude-3-5-haiku-20241022`
                            })
                        }
                    )

                    const reader = response.body.getReader()
                    const decoder = new TextDecoder('utf-8')
                    let result = ''

                    while (true) {
                        const { done, value } = await reader.read()
                        if (done) break
                        const chunk = decoder.decode(value, { stream: true })
                        const lines = chunk.split('\n').filter(line => line.trim())
                        for (const line of lines) {
                            if (line === 'data: [DONE]') return
                            if (line.startsWith('data: ')) {
                                const data = JSON.parse(line.slice(6))
                                if (data.choices[0].delta && data.choices[0].delta.content) {
                                    result += data.choices[0].delta.content
                                    editorContent.value = result // Update the editor content
                                }
                            }
                        }
                    }

                    editorContent.value = result.trim()
                    contentModified.value = true // Mark content as modified

                    // 自动生成图像请求
                    if (editorContent.value.includes('@endmindmap')) {
                        generateDiagram()
                    }
                } catch (error) {
                    console.error('Error generating mind map:', error)
                }
            }
        }

        const generateDiagram = async () => {
            try {
                const response = await fetch(
                    'https://mistpe-flask.hf.space/v1/images/generations',
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': 'Bearer sk-xxx', // Replace 'sk-xxx' with your actual API key
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            model: 'dall-e-3',
                            prompt: editorContent.value,
                            n: 1,
                            size: '1024x1024'
                        })
                    }
                )

                const data = await response.json()
                if (data && data.data && data.data[0] && data.data[0].url) {
                    diagramUrl.value = data.data[0].url // Update the diagram URL
                }
            } catch (error) {
                console.error('Error generating diagram:', error)
            }
        }

        const updateImageTransform = () => {
            imageRef.value.style.transform = `scale(${scale.value}) translate(${translateX.value}px, ${translateY.value}px)`
        }

        const onMouseDown = (event) => {
            isDragging.value = true
            startX.value = event.clientX - translateX.value
            startY.value = event.clientY - translateY.value
            document.addEventListener('mousemove', onMouseMove)
            document.addEventListener('mouseup', onMouseUp)
        }

        const onMouseMove = (event) => {
            if (!isDragging.value) return
            translateX.value = event.clientX - startX.value
            translateY.value = event.clientY - startY.value
            updateImageTransform()
        }

        const onMouseUp = () => {
            isDragging.value = false
            document.removeEventListener('mousemove', onMouseMove)
            document.removeEventListener('mouseup', onMouseUp)
        }

        const onWheel = (event) => {
            event.preventDefault()
            if (event.deltaY > 0) {
                scale.value *= 0.9
            } else {
                scale.value *= 1.1
            }
            updateImageTransform()
        }

        onMounted(() => {
            if (selectedMethod.value === '方法一') {
                editorContent.value = methodOneTemplate.trim()
                const { root } = transformer.transform(editorContent.value)
                mm.value = Markmap.create(svgRef.value, null, root)
                update()
            } else {
                editorContent.value = methodTwoTemplate.trim()
                const imageElement = imageRef.value
                imageElement.addEventListener('mousedown', onMouseDown)
                imageElement.addEventListener('wheel', onWheel)
            }
        })

        onUpdated(() => {
            if (selectedMethod.value === '方法一') {
                update()
            } else {
                const imageElement = imageRef.value
                imageElement.addEventListener('mousedown', onMouseDown)
                imageElement.addEventListener('wheel', onWheel)
            }
        })

        watch(selectedMethod, (newMethod, oldMethod) => {
            if (mm.value) {
                mm.value.destroy()
                mm.value = null
            }

            if (newMethod === '方法一') {
                window.location.reload() // 切换到方法一时刷新页面
            } else if (newMethod === '方法二') {
                contentModified.value = false // Reset contentModified when switching to method two
                scale.value = 1 // Reset scale when switching to method two
                translateX.value = 0
                translateY.value = 0
                editorContent.value = methodTwoTemplate.trim()
                const imageElement = imageRef.value
                imageElement.addEventListener('mousedown', onMouseDown)
                imageElement.addEventListener('wheel', onWheel)
            }
        })

        watch(editorContent, (newContent) => {
            if (selectedMethod.value === '方法二' && newContent.includes('@endmindmap')) {
                generateDiagram() // Automatically generate diagram when @endmindmap is detected
            }
        })

        return {
            title,
            referenceContent,
            editorContent,
            selectedMethod,
            contentModified,
            diagramUrl,
            generateMindMap,
            generateDiagram,
            zoomIn,
            zoomOut,
            fitToScreen,
            onSave,
            svgRef,
            imageRef,
            scale,
            isDragging,
            startX,
            startY,
            translateX,
            translateY,
            onMouseDown,
            onMouseMove,
            onMouseUp,
            onWheel
        }
    }
}
</script>

<style scoped>
.mind-container {
    padding: 20px;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
}

.left-panel {
    display: flex;
    flex-direction: column;
}

.right-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.svg-container {
    width: 100%;
    height: 80vh;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    overflow: hidden; /* Hide overflow to enable dragging */
    position: relative;
    background: #fff;
    display: flex;
    justify-content: center;
    align-items: center;
}

.svg-container img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain; /* Maintain aspect ratio */
}

.scalable {
    transition: transform 0.2s ease;
    cursor: grab; /* Indicate draggable content */
}

.scalable:active {
    cursor: grabbing; /* Change cursor while dragging */
}

.controls {
    margin-top: 10px;
}

.controls-mobile {
    display: none;
}

.controls-pc {
    display: flex;
}

.markmap-svg {
    width: 100%;
    height: 100%;
}

@media (max-width: 768px) {
    .mind-container {
        flex-direction: column;
    }

    .controls-pc {
        display: none;
    }

    .controls-mobile {
        display: flex;
        margin-top: 10px;
    }

    .right-panel {
        order: 2;
        width: 100%;
    }

    .left-panel {
        order: 1;
        width: 100%;
    }

    .svg-container {
        width: 100%;
        height: 60vh;
    }
}
</style>
