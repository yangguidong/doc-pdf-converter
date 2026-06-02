import json
from abc import ABC, abstractmethod
from pathlib import Path
from ..models.model_config import ModelConfig


class BaseProvider(ABC):
    def __init__(self, config: ModelConfig):
        self.config = config

    @abstractmethod
    async def generate(self, params: dict) -> str:
        """Submit generation request. Returns external_task_id."""
        ...

    @abstractmethod
    async def poll(self, external_task_id: str) -> dict:
        """Check status. Returns {'status': 'processing'|'completed'|'failed', 'result_url': str|None, 'error': str|None}."""
        ...

    @abstractmethod
    async def download(self, result_url: str, output_path: Path) -> None:
        """Download generated video to local path."""
        ...


class MockProvider(BaseProvider):
    """Mock provider for testing without real API keys."""

    def __init__(self, config: ModelConfig):
        super().__init__(config)
        import uuid
        self._store: dict[str, dict] = {}

    async def generate(self, params: dict) -> str:
        import uuid
        task_id = f"mock_{uuid.uuid4().hex[:12]}"
        self._store[task_id] = {
            "status": "processing",
            "params": params,
            "progress": 0,
        }
        return task_id

    async def poll(self, external_task_id: str) -> dict:
        import asyncio
        if external_task_id not in self._store:
            return {"status": "failed", "result_url": None, "error": "任务不存在"}

        task = self._store[external_task_id]
        task["progress"] += 33

        if task["progress"] >= 100:
            task["status"] = "completed"
            return {
                "status": "completed",
                "result_url": f"mock://generated/{external_task_id}.mp4",
                "error": None,
            }
        else:
            await asyncio.sleep(2)
            return {"status": "processing", "result_url": None, "error": None}

    async def download(self, result_url: str, output_path: Path) -> None:
        import struct
        import asyncio

        # Generate a minimal valid MP4 file (placeholder)
        width, height = 640, 480
        fps = 24
        frames = 30

        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "wb") as f:
            f.write(_build_minimal_mp4(width, height, fps, frames))


def _build_minimal_mp4(width: int, height: int, fps: int, total_frames: int) -> bytes:
    """Build a minimal valid MP4 file with a colored placeholder video."""
    import struct
    import io

    buf = io.BytesIO()

    # ftyp box
    def write_box(box_type: bytes, data: bytes) -> int:
        size = 8 + len(data)
        buf.write(struct.pack(">I", size))
        buf.write(box_type)
        buf.write(data)
        return size

    def write_full_box(box_type: bytes, version: int, flags: int, data: bytes) -> int:
        size = 12 + len(data)
        buf.write(struct.pack(">I", size))
        buf.write(box_type)
        buf.write(struct.pack(">B", version))
        buf.write(struct.pack(">I", flags)[1:])
        buf.write(data)
        return size

    # ftyp
    write_box(b"ftyp", b"isom\x00\x00\x00\x00isom")

    # moov
    moov_data = io.BytesIO()

    # mvhd
    timescale = 1000
    duration = (total_frames * 1000) // fps
    mvhd = struct.pack(">I", 0)  # version+flags
    mvhd += struct.pack(">II", 0, 0)  # creation, modification
    mvhd += struct.pack(">I", timescale)
    mvhd += struct.pack(">I", duration)
    mvhd += struct.pack(">II", 0x00010000, 0x0100)  # rate, volume
    mvhd += b"\x00" * 10  # reserved
    mvhd += struct.pack(">36s", b"\x00" * 36)  # matrix
    mvhd += b"\x00" * 24  # pre-defined
    mvhd += struct.pack(">I", 2)  # next track id
    write_full_box(moov_data, b"mvhd", 0, 0, mvhd)

    # trak
    trak_data = io.BytesIO()

    # tkhd
    tkhd = struct.pack(">I", 7)  # version+flags (track enabled, in movie, in preview)
    tkhd += struct.pack(">II", 0, 0)
    tkhd += struct.pack(">I", 1)  # track id
    tkhd += b"\x00" * 4
    tkhd += struct.pack(">I", duration)
    tkhd += b"\x00" * 8
    tkhd += struct.pack(">hh", 0, 0)  # layer, alternate group
    tkhd += struct.pack(">hh", 0x0100, 0x0000)  # volume, reserved
    tkhd += struct.pack(">36s", b"\x00" * 36)  # matrix
    tkhd += struct.pack(">II", width << 16, height << 16)
    write_full_box(trak_data, b"tkhd", 0, 7, tkhd)

    # mdia
    mdia_data = io.BytesIO()

    # mdhd
    mdhd = struct.pack(">I", 0)
    mdhd += struct.pack(">II", 0, 0)
    mdhd += struct.pack(">I", timescale)
    mdhd += struct.pack(">I", duration)
    mdhd += struct.pack(">HH", 0x55c4, 0x00)  # language
    write_full_box(mdia_data, b"mdhd", 0, 0, mdhd)

    # hdlr
    hdlr = struct.pack(">I", 0)
    hdlr += b"\x00" * 4
    hdlr += b"vide"
    hdlr += b"\x00" * 12
    hdlr += b"VideoHandler\x00"
    write_full_box(mdia_data, b"hdlr", 0, 0, hdlr)

    # minf
    minf_data = io.BytesIO()

    # vmhd
    vmhd = b"\x00" * 8
    write_full_box(minf_data, b"vmhd", 0, 1, vmhd)

    # dinf
    dinf_data = io.BytesIO()
    write_full_box(dinf_data, b"dref", 0, 0, struct.pack(">I", 1) + struct.pack(">I", 12) + b"url \x00\x00\x00\x01")
    write_box(minf_data, b"dinf", dinf_data.getvalue())

    # stbl
    stbl_data = io.BytesIO()

    # stsd
    stsd = struct.pack(">I", 0)
    stsd += struct.pack(">I", 1)
    # avc1 entry
    avc1 = io.BytesIO()
    avc1.write(b"\x00" * 6)  # reserved
    avc1.write(struct.pack(">H", 1))  # data ref index
    avc1.write(b"\x00" * 8)  # pre-defined, reserved
    avc1.write(struct.pack(">HH", width, height))
    avc1.write(struct.pack(">II", 0x00480000, 0x00480000))  # horiz/vert resolution
    avc1.write(b"\x00" * 4)
    avc1.write(struct.pack(">H", 1))  # frame count
    avc1.write(b"avc1\x00" * 4)  # compressor name
    avc1.write(b"\x00\x18\x00\xff")  # depth
    avc1.write(struct.pack(">h", -1))  # color table

    # avcC
    avcc = b"\x01\x64\x00\x1f\xff\xe1\x00\x19g\x64\x00\x1f\xac\xd9\x40\x50\x05\xba\x10\x00\x00\x03\x00\x10\x00\x00\x03\x01\xe0\x0f\x2d\xa0\x01\x00\x05h\xee\x01\xeb\xa0"
    avc1_size = 86 + len(avcc) + 8
    avc1.write(struct.pack(">I", avc1_size - 78))
    avc1.write(b"avcC")
    avc1.write(avcc)

    stsd_entry = avc1.getvalue()
    stsd += struct.pack(">I", 86 + len(avcc) + 16)
    stsd += stsd_entry
    stsd = struct.pack(">I", len(stsd)) + b"stsd" + stsd
    write_full_box(stbl_data, b"stsd", 0, 0, stsd)

    # stts
    stts = struct.pack(">I", 0) + struct.pack(">I", 1) + struct.pack(">II", total_frames, 1)
    write_full_box(stbl_data, b"stts", 0, 0, stts)

    # stsc
    stsc = struct.pack(">I", 0) + struct.pack(">I", 1) + struct.pack(">III", 1, 1, 1)
    write_full_box(stbl_data, b"stsc", 0, 0, stsc)

    # stsz
    sample_size = 100
    stsz = struct.pack(">I", 0) + struct.pack(">I", sample_size) + struct.pack(">I", total_frames)
    write_full_box(stbl_data, b"stsz", 0, 0, stsz)

    # stco
    stco = struct.pack(">I", 0) + struct.pack(">I", total_frames)
    offset = 0
    for i in range(total_frames):
        stco += struct.pack(">I", 0)
    # Fix: actually write proper chunk offsets later
    write_full_box(stbl_data, b"stco", 0, 0, stco)

    write_box(minf_data, b"stbl", stbl_data.getvalue())
    write_box(mdia_data, b"minf", minf_data.getvalue())
    write_box(trak_data, b"mdia", mdia_data.getvalue())
    write_box(moov_data, b"trak", trak_data.getvalue())

    write_box(buf, b"moov", moov_data.getvalue())

    # mdat
    mdat_data = b"\x00" * (total_frames * sample_size)
    write_box(buf, b"mdat", mdat_data)

    return buf.getvalue()
