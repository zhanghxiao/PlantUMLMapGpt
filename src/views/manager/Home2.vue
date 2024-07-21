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
                <img :src="diagramUrl" ref="imageRef" class="scalable" alt="生成图像" />
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
import { ref, onMounted, watch } from 'vue'
import * as htmlToImage from 'html-to-image'
import { saveAs } from 'file-saver'

export default {
    name: 'HomeView',
    setup() {
        const title = ref('')
        const referenceContent = ref('')
        const editorContent = ref('')
        const diagramUrl = ref(require('@/assets/css/four.png')) // Initial placeholder image
        const scale = ref(1) // Scale state for image zoom
        const isDragging = ref(false) // State for drag
        const startX = ref(0) // Initial X position for drag
        const startY = ref(0) // Initial Y position for drag
        const translateX = ref(0) // Translation X for drag
        const translateY = ref(0) // Translation Y for drag
        const imageRef = ref(null) // Reference to the image element

        const zoomIn = () => {
            scale.value *= 1.25
            updateImageTransform()
        }

        const zoomOut = () => {
            scale.value *= 0.8
            updateImageTransform()
        }

        const fitToScreen = () => {
            scale.value = 1
            translateX.value = 0
            translateY.value = 0
            updateImageTransform()
        }

        const onSave = async () => {
            const imageResponse = await fetch(diagramUrl.value)
            const imageBlob = await imageResponse.blob()
            saveAs(imageBlob, 'mindmap.png')
        }

        const generateMindMap = async () => {
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
                                    content: `我想使用代码创建一个《${title.value}》的用例图。请你提供Markdown格式的文本。节点显示时的语言根据标题的语言决定，首选中文，在Markdown格式中，首行必须是@startuml，结尾必须是@enduml。使用:Actor:或actor关键字定义角色，用圆括号()或usecase关键字定义用例。使用-->或->连接角色和用例，可以用冒号添加标签。可以用<<>>定义构造类型，用as关键字定义别名。使用<|--表示继承关系。可以用note添加注释，用package或rectangle进行分组。可以使用skinparam自定义样式。请使用left to right direction设置图表方向。参照以上格式，在markdown代码块中帮我创建一个有效的用例图。请包含至少一个角色、多个用例、关系和注释，以展示用例图的主要特征。下面是参考内容，如果有请参考，如果显示暂无则请你直接生成不用使用参考内容:${referenceContent.value ? referenceContent.value : '暂无'}`
                                }
                            ],
                            stream: true,
                            model: `gpt-4o-mini`,
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

                // 自动生成图像请求
                if (editorContent.value.includes('@endmindmap')) {
                    generateDiagram()
                }
            } catch (error) {
                console.error('Error generating mind map:', error)
            }
        }

        const generateDiagram = async () => {
            try {
                const response = await fetch(
                    'https://mistpe-flask-spaceswdt3.hf.space/v1/images/generations',
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
            editorContent.value = `
@startuml
left to right direction
actor "美食评论家" as fc
rectangle 餐厅用例图 {
  usecase "品尝食物" as UC1
  usecase "买单" as UC2
  usecase "饮用酒水" as UC3
}
fc --> UC1
fc --> UC2
fc --> UC3
@enduml

            `.trim()

            const imageElement = imageRef.value
            imageElement.addEventListener('mousedown', onMouseDown)
            imageElement.addEventListener('wheel', onWheel)
        })

        watch(editorContent, (newContent) => {
            if (newContent.includes('@enduml')) {
                generateDiagram() // Automatically generate diagram when @endmindmap is detected
            }
        })

        return {
            title,
            referenceContent,
            editorContent,
            diagramUrl,
            generateMindMap,
            zoomIn,
            zoomOut,
            fitToScreen,
            onSave,
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
