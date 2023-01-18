import { useRef } from "react";

type TextAreaProps = React.ComponentProps<'textarea'>

const AutoResizeTextArea: React.FC<TextAreaProps> = (props) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  const onChangeValue = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (props.onChange) {
      props.onChange(e);
    }
    const currentRef = ref.current;
    if (currentRef) {
      currentRef.style.height = `${currentRef.scrollHeight}px`
    }
  }

  return (
    <textarea
      ref={ref}
      {...props}
      onChange={onChangeValue}
    />
  )
}

export default AutoResizeTextArea;
