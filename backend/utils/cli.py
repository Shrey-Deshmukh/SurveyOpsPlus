import argparse


def _getArgParser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Process experiments")
    parser.add_argument(
        "-e", "--experiment", type=int, default=0, help="Experiment id to run, ID: 0,1"
    )
    parser.add_argument(
        "-p",
        "--provider",
        type=str,
        default="google",
        help="Model provider name: google",
    )
    parser.add_argument(
        "-m",
        "--model",
        type=str,
        default="gemini-2.5-flash",
        help="Model name: gemini-2.5-flash",
    )

    return parser


def getArgs():
    parser = _getArgParser()
    args = parser.parse_args()

    return args
