import axios from 'axios'

const PISTON_API_URL = 'https://emkc.org/api/v2/piston'

interface PistonExecuteRequest {
  language: string
  version: string
  files: Array<{
    name?: string
    content: string
  }>
  stdin?: string
  args?: string[]
  compile_timeout?: number
  run_timeout?: number
  compile_memory_limit?: number
  run_memory_limit?: number
}

interface PistonExecuteResponse {
  language: string
  version: string
  run: {
    stdout: string
    stderr: string
    code: number
    signal: string | null
    output: string
  }
  compile?: {
    stdout: string
    stderr: string
    code: number
    signal: string | null
    output: string
  }
}

interface TestCase {
  input: string
  expectedOutput: string
  explanation?: string
}

interface ExecutionResult {
  isCorrect: boolean
  feedback: string
  executionTime: number
  memoryUsed: number
  testResults: Array<{
    input: string
    expectedOutput: string
    actualOutput: string
    passed: boolean
  }>
}

const LANGUAGE_MAP: Record<string, { language: string; version: string; extension: string }> = {
  javascript: { language: 'javascript', version: '18.15.0', extension: 'js' },
  python: { language: 'python', version: '3.10.0', extension: 'py' },
  cpp: { language: 'cpp', version: '10.2.0', extension: 'cpp' },
  java: { language: 'java', version: '15.0.2', extension: 'java' },
  c: { language: 'c', version: '10.2.0', extension: 'c' },
}

export async function executeCode(
  code: string,
  language: string,
  testCases: TestCase[]
): Promise<ExecutionResult> {
  const langConfig = LANGUAGE_MAP[language]
  if (!langConfig) {
    throw new Error(`Unsupported language: ${language}`)
  }

  const testResults = []
  let allPassed = true
  let totalExecutionTime = 0

  for (const testCase of testCases) {
    try {
      const request: PistonExecuteRequest = {
        language: langConfig.language,
        version: langConfig.version,
        files: [
          {
            name: `main.${langConfig.extension}`,
            content: code,
          },
        ],
        stdin: testCase.input,
        run_timeout: 10000, // 10 seconds
        run_memory_limit: 128000, // 128MB
      }

      const startTime = Date.now()
      const response = await axios.post<PistonExecuteResponse>(`${PISTON_API_URL}/execute`, request)
      const endTime = Date.now()
      
      totalExecutionTime += (endTime - startTime)

      const actualOutput = response.data.run.stdout.trim()
      const expectedOutput = testCase.expectedOutput.trim()
      const passed = actualOutput === expectedOutput

      testResults.push({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput,
        passed,
      })

      if (!passed) {
        allPassed = false
      }

      // If there's a runtime error, mark as failed
      if (response.data.run.code !== 0) {
        allPassed = false
        testResults[testResults.length - 1].actualOutput = response.data.run.stderr || 'Runtime Error'
      }

    } catch (error) {
      allPassed = false
      testResults.push({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: `Execution Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        passed: false,
      })
    }
  }

  const passedTests = testResults.filter(result => result.passed).length
  const totalTests = testResults.length

  let feedback = ''
  if (allPassed) {
    feedback = `All ${totalTests} test cases passed! Great job!`
  } else {
    feedback = `${passedTests}/${totalTests} test cases passed. `
    const failedTests = testResults.filter(result => !result.passed)
    if (failedTests.length > 0) {
      feedback += `Failed test: Expected "${failedTests[0].expectedOutput}" but got "${failedTests[0].actualOutput}"`
    }
  }

  return {
    isCorrect: allPassed,
    feedback,
    executionTime: Math.round(totalExecutionTime / testCases.length), // Average execution time
    memoryUsed: 0, // Piston doesn't provide memory usage info easily
    testResults,
  }
}

export async function getPistonLanguages() {
  try {
    const response = await axios.get(`${PISTON_API_URL}/runtimes`)
    return response.data
  } catch (error) {
    console.error('Error fetching Piston languages:', error)
    return []
  }
}