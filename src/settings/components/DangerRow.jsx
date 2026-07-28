export default function DangerRow({
    title,
    description,
    buttonText,
    buttonClass,
    onClick,
}) {

    return (

        <div className="danger-row">

            <div className="danger-info">

                <h4>{title}</h4>

                <p>{description}</p>

            </div>

            <button
                className={buttonClass}
                onClick={onClick}
            >
                {buttonText}
            </button>

        </div>

    );

}