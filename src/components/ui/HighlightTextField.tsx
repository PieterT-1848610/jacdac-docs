/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/jsx-key */
import React, { useContext, useRef, lazy } from "react"
import Highlight, {
    defaultProps,
    Language,
    PrismTheme,
} from "prism-react-renderer"
// tslint:disable-next-line: no-submodule-imports match-default-export-name
import LIGHT_THEME from "prism-react-renderer/themes/github"
// tslint:disable-next-line: no-submodule-imports match-default-export-name
import DARK_THEME from "prism-react-renderer/themes/vsDark"
import DarkModeContext from "./DarkModeContext"
import { useEditable } from "use-editable"
import { Alert } from "@mui/material"
import { Grid, Tooltip } from "@mui/material"
import { styled } from "@mui/material/styles"
import Suspense from "../ui/Suspense"
const GithubPullRequestButton = lazy(
    () => import("../buttons/GithubPullRequestButton")
)

const AnnotationTooltip = styled(Tooltip)(({ theme }) => ({
    [`& .arrow`]: {
        color: theme.palette.error.main,
    },
    [`& .tooltip`]: {
        backgroundColor: theme.palette.error.main,
        color: theme.palette.common.white,
        boxShadow: theme.shadows[1],
        fontSize: theme.typography.body2.fontSize,
    },
}))

export default function HighlightTextField(props: {
    language: string
    code: string
    minHeight?: string
    maxHeight?: string
    onChange: (newValue: string) => void
    annotations?: jdspec.Diagnostic[]
    pullRequestTitle?: string
    pullRequestPath?: string
    pullRequestDescription?: string
    disabled?: boolean
}) {
    const {
        code,
        onChange,
        language,
        annotations,
        pullRequestTitle,
        pullRequestPath,
        pullRequestDescription,
        minHeight = "12rem",
        maxHeight,
        disabled,
    } = props
    const { darkMode } = useContext(DarkModeContext)
    const theme = (darkMode === "dark" ? DARK_THEME : LIGHT_THEME) as PrismTheme
    const editorRef = useRef(null)

    useEditable(editorRef, onChange, {
        disabled: !!disabled,
        indentation: 4,
    })
    return (
        <Grid container spacing={1} direction="row">
            <Grid item xs={12}>
                <Highlight
                    {...defaultProps}
                    code={code}
                    language={language as Language}
                    theme={theme}
                >
                    {({ className, style, tokens, getTokenProps }) => (
                        <pre
                            ref={editorRef}
                            className={className}
                            spellCheck={false}
                            style={{
                                ...style,
                                padding: "0.5rem",
                                minHeight,
                                maxHeight,
                                whiteSpace: "pre-wrap",
                                overflowWrap: "break-word",
                            }}
                        >
                            {tokens.map((line, i) => {
                                const annotation = annotations?.find(
                                    a => a.line === i + 1
                                )
                                const title = annotation?.message
                                const el = (
                                    <span
                                        key={i}
                                        style={
                                            annotation && {
                                                borderBottom: "dashed 1px red",
                                            }
                                        }
                                    >
                                        {line
                                            .filter(token => !token.empty)
                                            .map((token, key) => (
                                                <span
                                                    {...getTokenProps({
                                                        token,
                                                        key,
                                                    })}
                                                />
                                            ))}
                                        {i < tokens.length - 1 ? "\n" : null}
                                    </span>
                                )
                                return title ? (
                                    <AnnotationTooltip
                                        title={title}
                                        arrow
                                        key={i}
                                    >
                                        {el}
                                    </AnnotationTooltip>
                                ) : (
                                    el
                                )
                            })}
                        </pre>
                    )}
                </Highlight>
            </Grid>
            {!!annotations?.length && (
                <Grid item xs={12}>
                    <Alert severity="error">
                        {annotations.length === 1 ? (
                            <>
                                line {annotations[0].line}:{" "}
                                {annotations[0].message}
                            </>
                        ) : (
                            <ul>
                                {annotations.map((a, i) => (
                                    <li key={i}>
                                        line {a.line}: {a.message}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Alert>
                </Grid>
            )}
            {pullRequestTitle && pullRequestPath && (
                <Grid item>
                    <Suspense>
                        <GithubPullRequestButton
                            title={pullRequestTitle}
                            head={pullRequestPath}
                            description={pullRequestDescription}
                            files={{
                                [pullRequestPath + ".md"]: code,
                            }}
                        />
                    </Suspense>
                </Grid>
            )}
        </Grid>
    )
}
